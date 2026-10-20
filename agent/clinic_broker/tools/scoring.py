"""Deterministic scoring and greedy spatial scheduling tool (`score_and_schedule`)."""

from __future__ import annotations

import math
from typing import Any

from ..contract import Claim, Kind, Scale, SitePick
from .toolbox_client import call_toolbox_tool


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometers between two (lat, lon) points."""
    r = 6371.0088
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    return 2.0 * r * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))


def _build_reasons_for_row(row: dict[str, Any]) -> list[Claim]:
    tract_id = str(row["tract_id"]).zfill(11)
    pct_uninsured = float(row.get("pct_uninsured") or 0.0)
    safety_net_km = float(
        row.get("km_to_safety_net_adult")
        or row.get("safety_net_km")
        or row.get("km_to_safety_net")
        or 0.0
    )
    any_care_km = float(row.get("any_care_km") or row.get("km_to_any_care") or 0.0)
    pct_no_vehicle = row.get("pct_no_vehicle")
    pctile_no_vehicle = row.get("pctile_no_vehicle")
    pct_diabetes = row.get("pct_diabetes")
    pct_high_bp = row.get("pct_high_bp")
    pct_checkup = row.get("pct_checkup")

    reasons: list[Claim] = [
        Claim(
            claim=(
                f"Modeled adult (18-64) uninsured prevalence is {pct_uninsured:.1f}% "
                f"(CDC PLACES small-area estimate)."
            ),
            value=round(pct_uninsured, 1),
            unit="pct",
            tract_id=tract_id,
            scale=Scale.TRACT,
            kind=Kind.MODELED,
            source="burden_tracts.pct_uninsured",
        ),
        Claim(
            claim=(
                f"Straight-line distance to the nearest adult safety-net clinic (school clinics excluded) "
                f"is {safety_net_km:.2f} km (upper bound, not travel time; nearest federal site "
                f"of any kind is {any_care_km:.2f} km)."
            ),
            value=round(safety_net_km, 2),
            unit="km",
            tract_id=tract_id,
            scale=Scale.TRACT,
            kind=Kind.COMPUTED_UPPER_BOUND,
            source="tract_access_adult.km_to_safety_net_adult",
        ),
    ]

    if pct_no_vehicle is not None:
        pct_nv = float(pct_no_vehicle)
        pctile_str = (
            f" ({float(pctile_no_vehicle) * 100:.0f}th national percentile)"
            if pctile_no_vehicle is not None
            else ""
        )
        reasons.append(
            Claim(
                claim=f"{pct_nv:.1f}% of households have no vehicle available{pctile_str} (CDC SVI ACS survey).",
                value=round(pct_nv, 1),
                unit="pct",
                tract_id=tract_id,
                scale=Scale.TRACT,
                kind=Kind.SURVEY,
                source="burden_tracts.pct_no_vehicle",
            )
        )

    if pct_checkup is not None:
        reasons.append(
            Claim(
                claim=f"Routine checkup rate is {float(pct_checkup):.1f}% (CDC PLACES modeled estimate).",
                value=round(float(pct_checkup), 1),
                unit="pct",
                tract_id=tract_id,
                scale=Scale.TRACT,
                kind=Kind.MODELED,
                source="burden_tracts.pct_checkup",
            )
        )

    if pct_diabetes is not None and pct_high_bp is not None:
        reasons.append(
            Claim(
                claim=(
                    f"Chronic burden tiebreakers: diabetes {float(pct_diabetes):.1f}%, "
                    f"high blood pressure {float(pct_high_bp):.1f}% (CDC PLACES modeled)."
                ),
                value=round(float(pct_diabetes), 1),
                unit="pct",
                tract_id=tract_id,
                scale=Scale.TRACT,
                kind=Kind.MODELED,
                source="burden_tracts.pct_diabetes",
            )
        )

    return reasons


def score_and_schedule(
    n: int = 4,
    min_spacing_km: float = 5.0,
    exclude_tract_ids: list[str] | None = None,
    ranking_rows: list[dict[str, Any]] | None = None,
    prefer_audited_passing: bool = True,
) -> list[dict[str, Any]]:
    """Select `n` Saturday mobile clinic tracts with minimum centroid spacing.

    If `ranking_rows` is passed (e.g. synthetic test fixtures), runs greedy spacing selection.
    Race-blind: never reads demographics. Equity alternatives are computed on the Auditor side
    (tools/audit.py::find_equity_passing_set). `prefer_audited_passing` is kept for API
    compatibility and ignored.
    """
    excluded = {str(t).strip().zfill(11) for t in (exclude_tract_ids or []) if str(t).strip()}
    is_test_fixture = ranking_rows is not None
    rows = ranking_rows if is_test_fixture else call_toolbox_tool("get_need_ranking", {"limit": 100})

    # Ensure deterministic sort order by need_rank ASC / need_score DESC
    sorted_rows = sorted(
        rows,
        key=lambda r: (
            int(r.get("need_rank", 999999)),
            -float(r.get("need_score", 0.0)),
        ),
    )

    # Race-blind greedy selection: the Planner never sees demographics.
    # Otherwise standard greedy selection respecting spacing and exclusions
    selected = []
    selected_coords: list[tuple[float, float]] = []

    for row in sorted_rows:
        if len(selected) >= n:
            break
        tract_id = str(row["tract_id"]).strip().zfill(11)
        if tract_id in excluded:
            continue

        lat = row.get("latitude")
        lon = row.get("longitude")
        if lat is not None and lon is not None:
            lat_f, lon_f = float(lat), float(lon)
            too_close = any(
                haversine_km(lat_f, lon_f, slat, slon) < float(min_spacing_km)
                for slat, slon in selected_coords
            )
            if too_close:
                continue
        else:
            lat_f, lon_f = None, None

        sat_idx = len(selected) + 1
        safety_net_km = float(
            row.get("km_to_safety_net_adult")
            or row.get("safety_net_km")
            or row.get("km_to_safety_net")
            or 0.0
        )
        pick = SitePick(
            rank=sat_idx,
            saturday_index=sat_idx,
            tract_id=tract_id,
            score=round(float(row["need_score"]), 4),
            reasons=_build_reasons_for_row(row),
            flagged=False,
            flag_reason=None,
            latitude=lat_f,
            longitude=lon_f,
            km_to_safety_net=round(safety_net_km, 2),
        )
        selected.append(pick)
        if lat_f is not None and lon_f is not None:
            selected_coords.append((lat_f, lon_f))

    return [p.model_dump(mode="json") for p in selected]



def picks_for_tract_ids(tract_ids: list[str]) -> list[SitePick]:
    # Build SitePick objects for given tracts from the (race-blind) need ranking.
    rows = call_toolbox_tool("get_need_ranking", {"limit": 100})
    by_id = {str(r["tract_id"]).strip().zfill(11): r for r in rows}
    out: list[SitePick] = []
    for i, tid in enumerate(tract_ids, start=1):
        tid = str(tid).strip().zfill(11)
        row = by_id.get(tid)
        if not row:
            continue
        lat, lon = row.get("latitude"), row.get("longitude")
        km = float(row.get("km_to_safety_net_adult") or row.get("safety_net_km") or row.get("km_to_safety_net") or 0.0)
        out.append(SitePick(rank=i, saturday_index=i, tract_id=tid, score=round(float(row["need_score"]), 4),
                            reasons=_build_reasons_for_row(row), flagged=False, flag_reason=None,
                            latitude=float(lat) if lat is not None else None,
                            longitude=float(lon) if lon is not None else None,
                            km_to_safety_net=round(km, 2)))
    return out
