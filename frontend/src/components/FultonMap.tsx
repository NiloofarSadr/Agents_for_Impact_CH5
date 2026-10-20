"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  RECOMMENDED_STOPS,
  REJECTED_DRAFT_STOP,
  Locale,
  TractStop,
} from "@/data/contractData";
import {
  ShieldAlert,
  Navigation,
} from "lucide-react";

interface FultonMapProps {
  locale: Locale;
  selectedRank: number;
  onSelectRank: (rank: number) => void;
  showRejectedPin: boolean;
  onToggleRejectedPin: () => void;
}

const FIXED_CLINICS = [
  {
    name: "Grady Health System - Main",
    lat: 33.7516,
    lng: -84.3831,
    type: "Public Hospital & Health Center",
  },
  {
    name: "Southside Medical Center",
    lat: 33.7197,
    lng: -84.3995,
    type: "FQHC Safety Net",
  },
  {
    name: "Good Samaritan Health Center",
    lat: 33.7745,
    lng: -84.432,
    type: "Charitable Community Health",
  },
  {
    name: "West End Medical Center",
    lat: 33.738,
    lng: -84.424,
    type: "FQHC Safety Net",
  },
];

function parseLatLng(latStr: string, lngStr: string): [number, number] {
  const latMatch = latStr.match(/([\d.]+)/);
  const lngMatch = lngStr.match(/([\d.]+)/);
  const lat = latMatch ? parseFloat(latMatch[1]) : 33.749;
  const lng = lngMatch ? -parseFloat(lngMatch[1]) : -84.388;
  return [lat, lng];
}

export function FultonMap({
  locale,
  selectedRank,
  onSelectRank,
  showRejectedPin,
  onToggleRejectedPin,
}: FultonMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerGroupRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tileLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapType, setMapType] = useState<"google_road" | "google_hybrid" | "dark">("google_road");

  const selectedStop: TractStop =
    RECOMMENDED_STOPS.find((s) => s.rank === selectedRank) ||
    RECOMMENDED_STOPS[0];

  const labels = {
    en: {
      legendApproved: "Approved Saturday Van Stop (#1–#4)",
      legendPromoted: "Auditor Final 4 Exhaustive Search (#3)",
      legendRejected: "Not Chosen — Human Decision (13121011431)",
      legendClinic: "Fixed Safety-Net Clinic (FQHC)",
      toggleRejected: showRejectedPin
        ? "Hide Unselected Pin (13121011431)"
        : "Show Unselected Pin (13121011431)",
      activePinLabel: "Active Map Selection",
      recenterBtn: "Recenter Fulton County",
      loading: "Loading Real Fulton County Google Map...",
      tractHighlight: "Tract Service Catchment Area (~2.2 km)",
    },
    es: {
      legendApproved: "Parada Aprobada (#1–#4)",
      legendPromoted: "Selección Exhaustiva (#3)",
      legendRejected: "No Elegido — Decisión Humana (13121011431)",
      legendClinic: "Clínica Fija de Red de Seguridad (FQHC)",
      toggleRejected: showRejectedPin
        ? "Ocultar Pin No Elegido (11431)"
        : "Mostrar Pin No Elegido (11431)",
      activePinLabel: "Selección Activa en Mapa",
      recenterBtn: "Recentrar Condado de Fulton",
      loading: "Cargando Mapa de Google de Fulton...",
      tractHighlight: "Área de Cobertura del Tramo (~2.2 km)",
    },
    vi: {
      legendApproved: "Điểm Đỗ Được Duyệt (#1–#4)",
      legendPromoted: "Điểm Tìm kiếm Toàn diện (#3)",
      legendRejected: "Không Chọn — Quyết định Con người (13121011431)",
      legendClinic: "Phòng khám An sinh Cố định (FQHC)",
      toggleRejected: showRejectedPin
        ? "Ẩn Điểm Không Chọn (11431)"
        : "Hiện Điểm Không Chọn (11431)",
      activePinLabel: "Điểm Đang Chọn trên Bản đồ",
      recenterBtn: "Căn giữa Quận Fulton",
      loading: "Đang tải Bản đồ Google Quận Fulton...",
      tractHighlight: "Vùng Phủ Sóng Phân Khu (~2.2 km)",
    },
  }[locale];

  // Helper to get tile URL
  const getTileConfig = (type: "google_road" | "google_hybrid" | "dark") => {
    if (type === "google_hybrid") {
      return {
        url: "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
        subdomains: ["0", "1", "2", "3"],
        attribution: "&copy; Google Maps",
        maxZoom: 20,
      };
    }
    if (type === "dark") {
      return {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        subdomains: ["a", "b", "c", "d"],
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        maxZoom: 19,
      };
    }
    // google_road
    return {
      url: "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
      subdomains: ["0", "1", "2", "3"],
      attribution: "&copy; Google Maps",
      maxZoom: 20,
    };
  };

  // Initialize Leaflet Map with Google Maps Tiles
  useEffect(() => {
    let mounted = true;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;
      if (!mounted || !mapContainerRef.current) return;
      LRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: [33.72, -84.45],
        zoom: 11,
        zoomControl: true,
        attributionControl: false,
      });

      const tileCfg = getTileConfig(mapType);
      const tileLayer = L.tileLayer(tileCfg.url, {
        subdomains: tileCfg.subdomains,
        maxZoom: tileCfg.maxZoom,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      tileLayerRef.current = tileLayer;
      layerGroupRef.current = layerGroup;

      setMapLoaded(true);
    }

    initMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Layer Style Changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileCfg = getTileConfig(mapType);
    const newTileLayer = L.tileLayer(tileCfg.url, {
      subdomains: tileCfg.subdomains,
      maxZoom: tileCfg.maxZoom,
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
    newTileLayer.bringToBack();
  }, [mapType, mapLoaded]);

  // Render Overlays: Tract Catchment Highlights + Custom Numbered Pins + Clinics
  const renderOverlays = useCallback(() => {
    if (!mapLoaded || !layerGroupRef.current || !LRef.current) return;
    const L = LRef.current;
    const layerGroup = layerGroupRef.current;

    layerGroup.clearLayers();

    // 1. Draw Recommended Stops (Tracts #1–#4)
    RECOMMENDED_STOPS.forEach((stop) => {
      const pos = parseLatLng(stop.coordinates.lat, stop.coordinates.lng);
      const isSelected = stop.rank === selectedRank;

      // Census Tract Catchment Highlight Area (~2.2 km radius)
      const circle = L.circle(pos, {
        radius: 2200,
        color: isSelected ? "#0d9488" : "#0f766e",
        weight: isSelected ? 3.5 : 2,
        fillColor: isSelected ? "#14b8a6" : "#0d9488",
        fillOpacity: isSelected ? 0.38 : 0.22,
      });

      circle.on("click", () => {
        onSelectRank(stop.rank);
      });
      circle.addTo(layerGroup);

      // Custom Numbered SVG Pin
      const pinColor = isSelected ? "#0d9488" : "#0f766e";
      const iconHtml = `
        <div style="cursor: pointer; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)); transform: ${
          isSelected ? "scale(1.15)" : "scale(1)"
        }; transition: transform 0.2s;">
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 36 48">
            <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="${pinColor}" stroke="#ffffff" stroke-width="2"/>
            <circle cx="18" cy="18" r="12" fill="#0f172a"/>
            <text x="18" y="23" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="system-ui, sans-serif">#${stop.rank}</text>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "custom-stop-marker",
        iconSize: [34, 46],
        iconAnchor: [17, 46],
        popupAnchor: [0, -46],
      });

      const marker = L.marker(pos, { icon: customIcon });

      const popupContent = `
        <div style="color: #0f172a; font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4; padding: 2px;">
          <div style="font-weight: 700; color: #0d9488; font-size: 13px; margin-bottom: 2px;">
            Saturday #${stop.rank} · Tract ${stop.tractFips}
          </div>
          <div style="font-weight: 600; margin-bottom: 2px;">${stop.neighborhood[locale]}</div>
          <div style="color: #475569; margin-bottom: 6px;">${stop.siteName[locale]}</div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 4px; font-size: 11px;">
            <div>• Need Score: <strong>${stop.needScore}</strong></div>
            <div>• Distance to Adult Clinic: <strong>${stop.metrics[0]?.value || ">2 km"}</strong></div>
            <div style="color: #059669; font-weight: 600; margin-top: 2px;">✓ Exhaustive Audit Approved</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on("click", () => {
        onSelectRank(stop.rank);
      });
      marker.addTo(layerGroup);
    });

    // 2. Draw Rejected Draft Stop & Highlight if enabled
    if (showRejectedPin) {
      const rejectPos = parseLatLng(
        REJECTED_DRAFT_STOP.coordinates.lat,
        REJECTED_DRAFT_STOP.coordinates.lng
      );

      const rejectCircle = L.circle(rejectPos, {
        radius: 2000,
        color: "#e11d48",
        weight: 2,
        fillColor: "#f43f5e",
        fillOpacity: 0.22,
      });
      rejectCircle.addTo(layerGroup);

      const rejectIconHtml = `
        <div style="cursor: pointer; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 36 48">
            <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
            <circle cx="18" cy="18" r="11" fill="#4c0519"/>
            <text x="18" y="23" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="system-ui, sans-serif">✕</text>
          </svg>
        </div>
      `;

      const rejectIcon = L.divIcon({
        html: rejectIconHtml,
        className: "custom-reject-marker",
        iconSize: [32, 44],
        iconAnchor: [16, 44],
        popupAnchor: [0, -44],
      });

      const rejectMarker = L.marker(rejectPos, { icon: rejectIcon });
      const rejectPopupContent = `
        <div style="color: #0f172a; font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4;">
          <div style="font-weight: 700; color: #e11d48; font-size: 13px;">REJECTED DRAFT · ${REJECTED_DRAFT_STOP.tractFips}</div>
          <div style="font-weight: 600;">${REJECTED_DRAFT_STOP.neighborhood[locale]}</div>
          <div style="color: #9f1239; margin-top: 4px; font-weight: 500;">Violated 4/5ths Rule (Black ratio = 0.45 FLAG)</div>
        </div>
      `;
      rejectMarker.bindPopup(rejectPopupContent);
      rejectMarker.addTo(layerGroup);
    }

    // 3. Fixed Safety-Net Clinics (FQHCs)
    FIXED_CLINICS.forEach((clinic) => {
      const clinicIconHtml = `
        <div style="cursor: pointer; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="13" fill="#2563eb" stroke="#ffffff" stroke-width="2"/>
            <path d="M12 7h4v5h5v4h-5v5h-4v-5H7v-4h5z" fill="#ffffff"/>
          </svg>
        </div>
      `;

      const clinicIcon = L.divIcon({
        html: clinicIconHtml,
        className: "custom-clinic-marker",
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -13],
      });

      const clinicMarker = L.marker([clinic.lat, clinic.lng], { icon: clinicIcon });
      const clinicPopup = `
        <div style="color: #0f172a; font-family: system-ui, sans-serif; font-size: 12px;">
          <div style="font-weight: 700; color: #2563eb;">${clinic.name}</div>
          <div style="color: #64748b; font-size: 11px;">${clinic.type}</div>
          <div style="color: #475569; font-size: 10px; margin-top: 3px;">Fixed Clinic (Van must keep >2 km distance)</div>
        </div>
      `;
      clinicMarker.bindPopup(clinicPopup);
      clinicMarker.addTo(layerGroup);
    });
  }, [mapLoaded, selectedRank, showRejectedPin, locale, onSelectRank]);

  // Re-run overlays whenever selections or options change
  useEffect(() => {
    renderOverlays();
  }, [renderOverlays]);

  // Fly to selected stop when rank changes
  useEffect(() => {
    if (mapInstanceRef.current && selectedStop) {
      const pos = parseLatLng(selectedStop.coordinates.lat, selectedStop.coordinates.lng);
      mapInstanceRef.current.flyTo(pos, 13, { duration: 0.8 });
    }
  }, [selectedStop]);

  // Recenter button
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([33.72, -84.45], 11, { duration: 0.8 });
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
      {/* Header Bar */}
      <div className="p-4 sm:px-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Google Maps &middot; Live Tract Dispatch
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {locale === "en" && "Fulton County Google Street & Satellite Dispatch"}
              {locale === "es" && "Despacho en Google Maps del Condado de Fulton"}
              {locale === "vi" && "Bản đồ Google Điều phối Thực địa Quận Fulton"}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {locale === "en" &&
              "Live Google Street & Satellite map highlighting census tract catchment zones (~2.2 km) and fixed FQHC clinic buffers."}
            {locale === "es" &&
              "Mapa satelital y de calles de Google con zonas de cobertura (~2.2 km) y clínicas fijas FQHC."}
            {locale === "vi" &&
              "Bản đồ đường phố & vệ tinh Google với vùng phủ sóng phân khu (~2.2 km) và phòng khám FQHC."}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Map Type Switcher */}
          <div className="inline-flex rounded-lg border border-slate-700 bg-slate-800 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMapType("google_road")}
              className={`px-2.5 py-1 rounded-md transition ${
                mapType === "google_road" ? "bg-teal-600 text-white font-medium" : "text-slate-300 hover:text-white"
              }`}
            >
              Google Street
            </button>
            <button
              type="button"
              onClick={() => setMapType("google_hybrid")}
              className={`px-2.5 py-1 rounded-md transition ${
                mapType === "google_hybrid" ? "bg-teal-600 text-white font-medium" : "text-slate-300 hover:text-white"
              }`}
            >
              Google Satellite
            </button>
            <button
              type="button"
              onClick={() => setMapType("dark")}
              className={`px-2.5 py-1 rounded-md transition ${
                mapType === "dark" ? "bg-teal-600 text-white font-medium" : "text-slate-300 hover:text-white"
              }`}
            >
              Dark
            </button>
          </div>

          <button
            type="button"
            onClick={handleRecenter}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 flex items-center gap-1.5 transition"
            title={labels.recenterBtn}
          >
            <Navigation className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">{labels.recenterBtn}</span>
          </button>

          <button
            type="button"
            onClick={onToggleRejectedPin}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
              showRejectedPin
                ? "bg-rose-500/20 border-rose-500/50 text-rose-200"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            {labels.toggleRejected}
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[400px] sm:h-[460px] bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs z-20">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-300 font-medium">{labels.loading}</p>
            </div>
          </div>
        )}

        {/* Selected Tract HUD Badge */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-2xl max-w-xs z-[500] pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wide">
              {labels.activePinLabel}
            </span>
          </div>
          <p className="text-xs font-semibold text-white">
            Saturday #{selectedStop.rank} &middot; Tract {selectedStop.tractFips}
          </p>
          <p className="text-[11px] text-slate-300 truncate">
            {selectedStop.siteName[locale]}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
            <span>Score: <strong className="text-white">{selectedStop.needScore}</strong></span>
            <span>&bull;</span>
            <span className="text-teal-300">{labels.tractHighlight}</span>
          </div>
        </div>
      </div>

      {/* Legend & Stop Selector Footer */}
      <div className="p-3 sm:px-5 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-teal-500 border border-teal-300" />
            <span>{labels.legendApproved}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 border border-blue-300" />
            <span>{labels.legendClinic}</span>
          </div>
          {showRejectedPin && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-300" />
              <span>{labels.legendRejected}</span>
            </div>
          )}
        </div>

        {/* Quick Stop Jump Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Jump:</span>
          {RECOMMENDED_STOPS.map((s) => (
            <button
              key={s.rank}
              type="button"
              onClick={() => onSelectRank(s.rank)}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition ${
                s.rank === selectedRank
                  ? "bg-teal-500 text-slate-950 font-bold"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              #{s.rank}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
