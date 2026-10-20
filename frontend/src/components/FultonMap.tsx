"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  RECOMMENDED_STOPS,
  REJECTED_DRAFT_STOP,
  Locale,
  TractStop,
} from "@/data/contractData";
import {
  MapPin,
  ShieldAlert,
  Building2,
  CalendarClock,
  CheckCircle2,
  Layers,
  ZoomIn,
  Navigation,
} from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoogleAny = any;

interface FultonMapProps {
  locale: Locale;
  selectedRank: number;
  onSelectRank: (rank: number) => void;
  showRejectedPin: boolean;
  onToggleRejectedPin: () => void;
}

// Fixed adult safety-net clinics in Fulton County for distance verification
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

// Dark theme map styling matching the dashboard aesthetic
const DARK_MAP_STYLE: GoogleAny[] = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cbd5e1" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#132338" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0f172a" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#082f49" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#38bdf8" }],
  },
];

function parseLatLng(latStr: string, lngStr: string): { lat: number; lng: number } {
  const latMatch = latStr.match(/([\d.]+)/);
  const lngMatch = lngStr.match(/([\d.]+)/);
  const lat = latMatch ? parseFloat(latMatch[1]) : 33.749;
  const lng = lngMatch ? -parseFloat(lngMatch[1]) : -84.388;
  return { lat, lng };
}

export function FultonMap({
  locale,
  selectedRank,
  onSelectRank,
  showRejectedPin,
  onToggleRejectedPin,
}: FultonMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<GoogleAny>(null);
  const markersRef = useRef<GoogleAny[]>([]);
  const circlesRef = useRef<GoogleAny[]>([]);
  const infoWindowRef = useRef<GoogleAny>(null);

  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<"roadmap" | "hybrid" | "satellite">("roadmap");

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
      loading: "Initializing Google Maps API...",
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
      loading: "Iniciando Google Maps API...",
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
      loading: "Đang tải Google Maps API...",
      tractHighlight: "Vùng Phủ Sóng Phân Khu (~2.2 km)",
    },
  }[locale];

  // Load Google Maps JavaScript API
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const scriptUrl = apiKey
      ? `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`
      : `https://maps.googleapis.com/maps/api/js?libraries=geometry`;

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => setMapLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapLoaded(true);
    };
    script.onerror = () => {
      setMapError("Could not load Google Maps script. Showing fallback.");
    };
    document.head.appendChild(script);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || !window.google?.maps) return;

    try {
      const initialCenter = { lat: 33.72, lng: -84.45 };
      const map = new google.maps.Map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 11,
        mapTypeId: mapType,
        styles: mapType === "roadmap" ? DARK_MAP_STYLE : undefined,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;
      infoWindowRef.current = new google.maps.InfoWindow();
    } catch (e) {
      console.error("Map init error:", e);
      setMapError("Failed to initialize Google Maps.");
    }
  }, [mapLoaded, mapType]);

  // Update Markers & Highlighted Tract Areas
  const renderOverlays = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps) return;

    // Clear previous markers and circles
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    // 1. Draw Recommended Stops & Tract Highlight Areas
    RECOMMENDED_STOPS.forEach((stop) => {
      const pos = parseLatLng(stop.coordinates.lat, stop.coordinates.lng);
      const isSelected = stop.rank === selectedRank;

      // Highlighted Census Tract Service Area Circle (Catchment Area)
      const circle = new google.maps.Circle({
        strokeColor: isSelected ? "#2dd4bf" : "#0d9488",
        strokeOpacity: isSelected ? 0.95 : 0.6,
        strokeWeight: isSelected ? 3 : 1.8,
        fillColor: isSelected ? "#14b8a6" : "#0f766e",
        fillOpacity: isSelected ? 0.35 : 0.2,
        map,
        center: pos,
        radius: 2200, // ~2.2 km tract catchment area
      });

      circle.addListener("click", () => {
        onSelectRank(stop.rank);
      });
      circlesRef.current.push(circle);

      // SVG Badge Pin Marker
      const pinColor = isSelected ? "%232dd4bf" : "%230d9488";
      const textColor = "%23ffffff";
      const markerIcon = {
        url: `data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48"><path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="${pinColor}" stroke="%23ffffff" stroke-width="2"/><circle cx="18" cy="18" r="12" fill="%230f172a"/><text x="18" y="23" font-size="14" font-weight="bold" fill="${textColor}" text-anchor="middle" font-family="sans-serif">%23${stop.rank}</text></svg>`,
        scaledSize: new google.maps.Size(36, 48),
        anchor: new google.maps.Point(18, 48),
      };

      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: `Saturday #${stop.rank}: ${stop.siteName[locale]}`,
        icon: markerIcon,
        zIndex: isSelected ? 999 : 100,
        animation: isSelected ? google.maps.Animation.BOUNCE : undefined,
      });

      if (isSelected && marker.getAnimation()) {
        setTimeout(() => marker.setAnimation(null), 1400);
      }

      marker.addListener("click", () => {
        onSelectRank(stop.rank);
        if (infoWindowRef.current) {
          const content = `
            <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; line-height: 1.4; max-width: 240px; padding: 4px;">
              <strong style="color: #0f766e; font-size: 13px;">Saturday #${stop.rank} · ${stop.tractFips}</strong><br/>
              <span style="font-weight: 600;">${stop.neighborhood[locale]}</span><br/>
              <span style="color: #475569;">${stop.siteName[locale]}</span>
              <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0;">
                <div>• Need Score: <strong>${stop.needScore}</strong></div>
                <div>• Status: <span style="color: #059669; font-weight: 600;">Audited & Approved</span></div>
              </div>
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, marker);
        }
      });

      markersRef.current.push(marker);
    });

    // 2. Draw Rejected Draft Stop & Highlight if enabled
    if (showRejectedPin) {
      const rejectPos = parseLatLng(
        REJECTED_DRAFT_STOP.coordinates.lat,
        REJECTED_DRAFT_STOP.coordinates.lng
      );

      const rejectCircle = new google.maps.Circle({
        strokeColor: "#f43f5e",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#e11d48",
        fillOpacity: 0.18,
        map,
        center: rejectPos,
        radius: 2000,
      });
      circlesRef.current.push(rejectCircle);

      const rejectIcon = {
        url: `data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 36 48"><path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="%23f43f5e" stroke="%23ffffff" stroke-width="2"/><circle cx="18" cy="18" r="11" fill="%234c0519"/><text x="18" y="23" font-size="14" font-weight="bold" fill="%23ffffff" text-anchor="middle" font-family="sans-serif">✕</text></svg>`,
        scaledSize: new google.maps.Size(34, 46),
        anchor: new google.maps.Point(17, 46),
      };

      const rejectMarker = new google.maps.Marker({
        position: rejectPos,
        map,
        title: `REJECTED DRAFT: Tract ${REJECTED_DRAFT_STOP.tractFips}`,
        icon: rejectIcon,
        zIndex: 50,
      });

      rejectMarker.addListener("click", () => {
        if (infoWindowRef.current) {
          const content = `
            <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; line-height: 1.4; max-width: 240px; padding: 4px;">
              <strong style="color: #e11d48; font-size: 13px;">REJECTED · ${REJECTED_DRAFT_STOP.tractFips}</strong><br/>
              <span style="font-weight: 600;">${REJECTED_DRAFT_STOP.neighborhood[locale]}</span><br/>
              <span style="color: #be123c;">Violated 4/5ths Rule (Black ratio = 0.45 FLAG)</span>
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, rejectMarker);
        }
      });

      markersRef.current.push(rejectMarker);
    }

    // 3. Fixed Safety-Net Clinics (FQHCs) to visually show >2km rule
    FIXED_CLINICS.forEach((clinic) => {
      const clinicIcon = {
        url: `data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="12" fill="%233b82f6" stroke="%23ffffff" stroke-width="2"/><path d="M12 7h4v5h5v4h-5v5h-4v-5H7v-4h5z" fill="%23ffffff"/></svg>`,
        scaledSize: new google.maps.Size(26, 26),
        anchor: new google.maps.Point(13, 13),
      };

      const marker = new google.maps.Marker({
        position: { lat: clinic.lat, lng: clinic.lng },
        map,
        title: clinic.name,
        icon: clinicIcon,
        zIndex: 40,
      });

      marker.addListener("click", () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; padding: 4px;">
              <strong style="color: #2563eb;">${clinic.name}</strong><br/>
              <span style="color: #64748b;">${clinic.type}</span><br/>
              <span style="font-size: 11px; color: #475569;">Fixed Safety-Net Site (Van must keep >2 km spacing)</span>
            </div>
          `);
          infoWindowRef.current.open(map, marker);
        }
      });

      markersRef.current.push(marker);
    });
  }, [selectedRank, showRejectedPin, locale, onSelectRank]);

  // Re-run overlays whenever selections or options change
  useEffect(() => {
    if (mapLoaded && mapInstanceRef.current) {
      renderOverlays();
    }
  }, [mapLoaded, renderOverlays]);

  // Pan smoothly to selected stop when rank changes
  useEffect(() => {
    if (mapInstanceRef.current && selectedStop) {
      const pos = parseLatLng(selectedStop.coordinates.lat, selectedStop.coordinates.lng);
      mapInstanceRef.current.panTo(pos);
    }
  }, [selectedStop]);

  // Recenter button action
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: 33.72, lng: -84.45 });
      mapInstanceRef.current.setZoom(11);
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
      {/* Header Bar */}
      <div className="p-4 sm:px-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Google Maps API · Live Tract Dispatch
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {locale === "en" && "Fulton County Google Street & Satellite Dispatch"}
              {locale === "es" && "Despacho en Google Maps del Condado de Fulton"}
              {locale === "vi" && "Bản đồ Google Điều phối Thực địa Quận Fulton"}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {locale === "en" &&
              "Real Google Map with highlighted census tract catchment areas (~2.2 km) and FQHC fixed clinic spacing."}
            {locale === "es" &&
              "Mapa de Google real con áreas de cobertura de tramos resaltadas (~2.2 km) y clínicas fijas."}
            {locale === "vi" &&
              "Bản đồ Google thực tế với các vùng phân khu điều tra được tô sáng (~2.2 km) và phòng khám cố định."}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Map Type Switcher */}
          <div className="inline-flex rounded-lg border border-slate-700 bg-slate-800 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setMapType("roadmap");
                if (mapInstanceRef.current) mapInstanceRef.current.setMapTypeId("roadmap");
              }}
              className={`px-2.5 py-1 rounded-md transition ${
                mapType === "roadmap" ? "bg-teal-600 text-white font-medium" : "text-slate-300 hover:text-white"
              }`}
            >
              Street
            </button>
            <button
              type="button"
              onClick={() => {
                setMapType("hybrid");
                if (mapInstanceRef.current) mapInstanceRef.current.setMapTypeId("hybrid");
              }}
              className={`px-2.5 py-1 rounded-md transition ${
                mapType === "hybrid" ? "bg-teal-600 text-white font-medium" : "text-slate-300 hover:text-white"
              }`}
            >
              Satellite
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

      {/* Google Maps Container */}
      <div className="relative w-full h-[400px] sm:h-[460px] bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full" />

        {!mapLoaded && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs z-20">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-300 font-medium">{labels.loading}</p>
            </div>
          </div>
        )}

        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-20 p-4">
            <div className="max-w-md bg-slate-900 border border-amber-500/40 rounded-xl p-4 text-center space-y-2">
              <p className="text-xs text-amber-300 font-medium">{mapError}</p>
              <p className="text-[11px] text-slate-400">
                To use your custom Google Maps key, set <code className="text-teal-300">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
              </p>
            </div>
          </div>
        )}

        {/* Selected Tract HUD Badge */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-2xl max-w-xs z-10 pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wide">
              {labels.activePinLabel}
            </span>
          </div>
          <p className="text-xs font-semibold text-white">
            Saturday #{selectedStop.rank} · Tract {selectedStop.tractFips}
          </p>
          <p className="text-[11px] text-slate-300 truncate">
            {selectedStop.siteName[locale]}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
            <span>Score: <strong className="text-white">{selectedStop.needScore}</strong></span>
            <span>•</span>
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
