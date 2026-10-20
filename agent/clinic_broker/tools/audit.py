"""Auditor verification tools: `tie_check`, `remeasure_border`, `spacing_check`, `equity_audit`."""

from __future__ import annotations

from typing import Any

from ..contract import (
    AuditEquity,
    AuditRevision,
    EquityGroupComparison,
    ProblemType,
)
from .scoring import haversine_km
from .toolbox_client import call_toolbox_tool


def tie_check(
    tract_ids: list[str],
    ranking_rows: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Check whether any picked tract is statistically tied with the next unpicked tract.

    - If `_crude95ci` confidence-interval columns exist: two picks are tied when uninsured CIs
      overlap with the next-ranked unpicked tract.
    - If CI columns do not exist (as in `a4i_health.burden_tracts`): flag picks whose `need_score`
      is within 5% of the next unpicked tract, and label the rule "approximate, no CI loaded".
    """
    picks_norm = [str(t).strip().zfill(11) for t in tract_ids]
    picks_set = set(picks_norm)
    rows = ranking_rows if ranking_rows is not None else call_toolbox_tool("get_need_ranking", {"limit": 100})

    sorted_rows = sorted(
        rows,
        key=lambda r: (
            int(r.get("need_rank", 999999)),
            -float(r.get("need_score", 0.0)),
        ),
    )

    by_id = {str(r["tract_id"]).strip().zfill(11): r for r in sorted_rows}
    unpicked = [r for r in sorted_rows if str(r["tract_id"]).strip().zfill(11) not in picks_set]

    has_ci = any(
        r.get("pct_uninsured_ci_low") is not None and r.get("pct_uninsured_ci_high") is not None
        for r in sorted_rows
    )
    rule_label = "ci_overlap_95pct" if has_ci else "approximate, no CI loaded"

    ties: list[dict[str, Any]] = []
    for tid in picks_norm:
        pick_row = by_id.get(tid)
        if not pick_row or not unpicked:
            continue
        pick_rank = int(pick_row.get("need_rank", 0))
        pick_score = float(pick_row.get("need_score", 0.0))

        # Compare against the highest-ranked unpicked tract ranked below this pick (or top unpicked overall)
        lower_unpicked = [
            u for u in unpicked if int(u.get("need_rank", 999999)) > pick_rank
        ]
        challenger = lower_unpicked[0] if lower_unpicked else unpicked[0]
        challenger_id = str(challenger["tract_id"]).strip().zfill(11)
        challenger_score = float(challenger.get("need_score", 0.0))

        if has_ci:
            p_low = float(pick_row["pct_uninsured_ci_low"])
            p_high = float(pick_row["pct_uninsured_ci_high"])
            c_low = float(challenger["pct_uninsured_ci_low"])
            c_high = float(challenger["pct_uninsured_ci_high"])
            is_tied = max(p_low, c_low) <= min(p_high, c_high)
            rel_diff = abs(pick_score - challenger_score) / max(pick_score, 1e-9)
        else:
            rel_diff = abs(pick_score - challenger_score) / max(pick_score, 1e-9)
            is_tied = rel_diff <= 0.05

        if is_tied:
            explanation = (
                f"Tract {tid} (need_score={pick_score:.4f}) is within {rel_diff * 100:.2f}% "
                f"(<= 5.0% threshold; rule: {rule_label}) of unpicked tract {challenger_id} "
                f"(need_score={challenger_score:.4f})."
            )
            rev = AuditRevision(
                pick_tract_id=tid,
                problem_type=ProblemType.STATISTICAL_TIE,
                explanation=explanation,
                suggested_action=(
                    f"Acknowledge statistical tie ({rule_label}) with tract {challenger_id} "
                    f"or apply secondary burden tiebreakers (diabetes, high BP, routine checkup)."
                ),
            )
            ties.append(
                {
                    "pick_tract_id": tid,
                    "challenger_tract_id": challenger_id,
                    "pick_score": pick_score,
                    "challenger_score": challenger_score,
                    "relative_diff_pct": round(rel_diff * 100.0, 2),
                    "rule": rule_label,
                    "revision": rev.model_dump(mode="json"),
                }
            )

    return {
        "rule": rule_label,
        "has_ties": len(ties) > 0,
        "ties": ties,
    }


def remeasure_border(
    tract_id: str,
    state_rows: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Check if an out-of-county safety-net clinic in `care_sites_state` is closer and < 3.0 km.

    Calls `get_nearest_state_safety_net(tract_id)`. If `is_outside_fulton` is True,
    `state_safety_net_km < in_county_safety_net_km`, and `state_safety_net_km < 3.0`,
    returns a `BORDER_CLINIC_CLOSER` revision with both distances.
    """
    tid = str(tract_id).strip().zfill(11)
    rows = (
        state_rows
        if state_rows is not None
        else call_toolbox_tool("get_nearest_state_safety_net", {"tract_id": tid})
    )
    if not rows:
        return {
            "tract_id": tid,
            "border_clinic_closer": False,
            "revision": None,
        }

    row = rows[0]
    state_km = float(row.get("state_safety_net_km", 999.0))
    in_county_km = float(row.get("in_county_safety_net_km", 999.0))
    is_outside = bool(row.get("is_outside_fulton", False))
    facility_name = str(row.get("facility_name", "Out-of-county safety-net site"))
    city = str(row.get("city", ""))

    fires = is_outside and (state_km < in_county_km) and (state_km < 3.0)
    revision = None
    if fires:
        rev = AuditRevision(
            pick_tract_id=tid,
            problem_type=ProblemType.BORDER_CLINIC_CLOSER,
            explanation=(
                f"Tract {tid} has an in-county safety-net distance of {in_county_km:.2f} km, "
                f"but out-of-county safety-net clinic '{facility_name}' ({city}) in care_sites_state "
                f"is {state_km:.2f} km away (< 3.0 km straight-line upper bound)."
            ),
            suggested_action=f"Exclude tract {tid} via exclude_tract_ids and re-run score_and_schedule.",
        )
        revision = rev.model_dump(mode="json")

    return {
        "tract_id": tid,
        "facility_name": facility_name,
        "city": city,
        "state_safety_net_km": state_km,
        "in_county_safety_net_km": in_county_km,
        "is_outside_fulton": is_outside,
        "border_clinic_closer": fires,
        "revision": revision,
    }


def spacing_check(
    tract_ids: list[str],
    min_spacing_km: float = 3.0,
    ranking_rows: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Check whether any two picked tracts are closer than `min_spacing_km` (default 3.0 km)."""
    picks_norm = [str(t).strip().zfill(11) for t in tract_ids]
    rows = ranking_rows if ranking_rows is not None else call_toolbox_tool("get_need_ranking", {"limit": 100})
    by_id = {str(r["tract_id"]).strip().zfill(11): r for r in rows}

    violations: list[dict[str, Any]] = []
    for i in range(len(picks_norm)):
        for j in range(i + 1, len(picks_norm)):
            t1, t2 = picks_norm[i], picks_norm[j]
            r1, r2 = by_id.get(t1), by_id.get(t2)
            if not r1 or not r2:
                continue
            if r1.get("latitude") is None or r2.get("latitude") is None:
                continue
            dist_km = haversine_km(
                float(r1["latitude"]),
                float(r1["longitude"]),
                float(r2["latitude"]),
                float(r2["longitude"]),
            )
            if dist_km < float(min_spacing_km):
                rev = AuditRevision(
                    pick_tract_id=t2,
                    problem_type=ProblemType.TOO_CLOSE_TOGETHER,
                    explanation=(
                        f"Picked tracts {t1} and {t2} are only {dist_km:.2f} km apart "
                        f"(< {min_spacing_km:.1f} km minimum spacing)."
                    ),
                    suggested_action=(
                        f"Exclude tract {t2} or enforce min_spacing_km={min_spacing_km:.1f} in score_and_schedule."
                    ),
                )
                violations.append(
                    {
                        "tract_1": t1,
                        "tract_2": t2,
                        "distance_km": round(dist_km, 2),
                        "revision": rev.model_dump(mode="json"),
                    }
                )

    return {
        "min_spacing_km": min_spacing_km,
        "has_violations": len(violations) > 0,
        "violations": violations,
    }


def equity_audit(
    tract_ids: list[str],
    tract_demo_rows: list[dict[str, Any]] | None = None,
    county_demo_rows: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Compare demographic shares in picked tracts vs Fulton County overall.

    When running against live BigQuery, uses `get_equity_audit_v2` to benchmark against
    the county uninsured population distribution (Black 54.2%, Hispanic 8.4%, White 29.0%,
    Asian 5.4%), applying the four-fifths ratio threshold (< 0.8 = equity flag).

    When offline test fixtures are provided, evaluates tract vs county population counts.
    """
    picks_norm = [str(t).strip().zfill(11) for t in tract_ids]

    # Try live BigQuery uninsured-weighted demographic audit first if no explicit test fixtures
    if tract_demo_rows is None and county_demo_rows is None:
        try:
            v2_rows = call_toolbox_tool("get_equity_audit_v2", {"tract_ids": ",".join(picks_norm)})
            if len(v2_rows) >= 2:
                by_grp = {r["grp"]: r for r in v2_rows}
                c_unins = by_grp.get("county_uninsured", {})
                p_unins = by_grp.get("plan", {})

                c_total_est = int(c_unins.get("est_uninsured") or 114470)
                p_total_est = int(p_unins.get("est_uninsured") or 0)

                group_keys = [
                    ("Black or African American (Non-Hispanic)", "pct_black"),
                    ("White (Non-Hispanic)", "pct_white"),
                    ("Hispanic or Latino (Any Race)", "pct_hispanic"),
                    ("Asian (Non-Hispanic)", "pct_asian"),
                ]

                table: list[EquityGroupComparison] = []
                flags: list[str] = []

                for label, k in group_keys:
                    p_pct = float(p_unins.get(k) or 0.0)
                    c_pct = float(c_unins.get(k) or 0.0)
                    diff = round(p_pct - c_pct, 1)
                    ratio = round(p_pct / c_pct, 2) if c_pct > 0 else 1.0
                    is_flagged = ratio < 0.8
                    if is_flagged:
                        flags.append(f"{label} ({ratio:.2f} < 0.80)")

                    p_pop = int(round(p_total_est * (p_pct / 100.0)))
                    c_pop = int(round(c_total_est * (c_pct / 100.0)))

                    table.append(
                        EquityGroupComparison(
                            group=label,
                            plan_population=p_pop,
                            plan_share_pct=p_pct,
                            county_population=c_pop,
                            county_share_pct=c_pct,
                            diff_pct_points=diff,
                            audit_ratio=ratio,
                            flagged=is_flagged,
                        )
                    )

                # Other / combined
                p_sum = sum(float(p_unins.get(k) or 0.0) for _, k in group_keys)
                c_sum = sum(float(c_unins.get(k) or 0.0) for _, k in group_keys)
                p_other_pct = round(max(0.0, 100.0 - p_sum), 1)
                c_other_pct = round(max(0.0, 100.0 - c_sum), 1)
                table.append(
                    EquityGroupComparison(
                        group="Other / Two or More Races",
                        plan_population=int(round(p_total_est * (p_other_pct / 100.0))),
                        plan_share_pct=p_other_pct,
                        county_population=int(round(c_total_est * (c_other_pct / 100.0))),
                        county_share_pct=c_other_pct,
                        diff_pct_points=round(p_other_pct - c_other_pct, 1),
                        audit_ratio=round(p_other_pct / c_other_pct, 2) if c_other_pct > 0 else 1.0,
                        flagged=False,
                    )
                )

                if flags:
                    finding = (
                        f"Equity Flag: The plan falls below the four-fifths (0.80) threshold for {', '.join(flags)} "
                        f"relative to Fulton County's uninsured distribution (Black 54.2%, Hispanic 8.4%, White 29.0%, Asian 5.4%)."
                    )
                else:
                    b_r = next((r.audit_ratio for r in table if "Black" in r.group), 1.0)
                    h_r = next((r.audit_ratio for r in table if "Hispanic" in r.group), 1.0)
                    w_r = next((r.audit_ratio for r in table if "White" in r.group), 1.0)
                    a_r = next((r.audit_ratio for r in table if "Asian" in r.group), 1.0)
                    finding = (
                        f"Plan passes the equity audit across all groups without flags "
                        f"(Black {b_r:.2f}, Hispanic {h_r:.2f}, White {w_r:.2f}, Asian {a_r:.2f} >= 0.80 benchmark). "
                        f"Total estimated uninsured served: ~{p_total_est:,}."
                    )

                structural_hypothesis = (
                    "Race and ethnicity were strictly firewalled out of the Planner's inputs and scoring formula. "
                    "Any demographic difference reflects structural co-variation between adult uninsurance, "
                    "zero-vehicle household prevalence, and distance to adult safety-net care across Fulton County."
                )

                return AuditEquity(
                    table=table,
                    finding=finding,
                    structural_hypothesis=structural_hypothesis,
                ).model_dump(mode="json")
        except Exception:
            # Fall back to tract_demographics table if v2 query encounters an issue
            pass

    # Fallback / offline unit-test path using total population
    tract_rows = (
        tract_demo_rows
        if tract_demo_rows is not None
        else call_toolbox_tool("get_tract_demographics", {"tract_ids": ",".join(picks_norm)})
    )
    county_rows = (
        county_demo_rows
        if county_demo_rows is not None
        else call_toolbox_tool("get_county_demographics", {})
    )

    if not county_rows:
        raise RuntimeError("get_county_demographics returned no rows from a4i_audit.tract_demographics")

    c_row = county_rows[0]
    county_total = max(int(c_row.get("total_pop") or 0), 1)
    plan_total = max(sum(int(r.get("total_pop") or 0) for r in tract_rows), 1)

    groups = [
        ("Black or African American (Non-Hispanic)", "black_pop"),
        ("White (Non-Hispanic)", "white_pop"),
        ("Hispanic or Latino (Any Race)", "hispanic_pop"),
        ("Asian (Non-Hispanic)", "asian_pop"),
    ]

    table = []
    for label, col in groups:
        p_pop = sum(int(r.get(col) or 0) for r in tract_rows)
        c_pop = int(c_row.get(col) or 0)
        p_pct = round(100.0 * p_pop / plan_total, 1)
        c_pct = round(100.0 * c_pop / county_total, 1)
        diff = round(p_pct - c_pct, 1)
        ratio = round(p_pct / c_pct, 2) if c_pct > 0 else 1.0
        table.append(
            EquityGroupComparison(
                group=label,
                plan_population=p_pop,
                plan_share_pct=p_pct,
                county_population=c_pop,
                county_share_pct=c_pct,
                diff_pct_points=diff,
                audit_ratio=ratio,
                flagged=(ratio < 0.8),
            )
        )

    # Other / Two or More Races combined
    other_cols = ("amerindian_pop", "other_race_pop", "two_or_more_races_pop")
    p_other = sum(sum(int(r.get(col) or 0) for col in other_cols) for r in tract_rows)
    c_other = sum(int(c_row.get(col) or 0) for col in other_cols)
    p_other_pct = round(100.0 * p_other / plan_total, 1)
    c_other_pct = round(100.0 * c_other / county_total, 1)
    table.append(
        EquityGroupComparison(
            group="Other / Two or More Races",
            plan_population=p_other,
            plan_share_pct=p_other_pct,
            county_population=c_other,
            county_share_pct=c_other_pct,
            diff_pct_points=round(p_other_pct - c_other_pct, 1),
            audit_ratio=round(p_other_pct / c_other_pct, 2) if c_other_pct > 0 else 1.0,
            flagged=False,
        )
    )

    max_abs_diff = max(abs(row.diff_pct_points) for row in table)
    if max_abs_diff <= 3.0:
        finding = (
            "No meaningful difference between the population-weighted racial/ethnic composition "
            "of the selected tracts and Fulton County overall (all groups within 3.0 percentage points)."
        )
    else:
        by_group = {row.group: row for row in table}
        b = by_group["Black or African American (Non-Hispanic)"]
        w = by_group["White (Non-Hispanic)"]
        h = by_group["Hispanic or Latino (Any Race)"]
        finding = (
            f"Across the {len(picks_norm)} selected tracts (total pop {plan_total:,}), "
            f"Black residents are {b.plan_share_pct:.1f}% vs {b.county_share_pct:.1f}% countywide "
            f"({b.diff_pct_points:+.1f} pp), Hispanic/Latino residents are {h.plan_share_pct:.1f}% vs "
            f"{h.county_share_pct:.1f}% countywide ({h.diff_pct_points:+.1f} pp), and White residents "
            f"are {w.plan_share_pct:.1f}% vs {w.county_share_pct:.1f}% countywide ({w.diff_pct_points:+.1f} pp)."
        )

    structural_hypothesis = (
        "Race and ethnicity were strictly firewalled out of the Planner's inputs and scoring formula. "
        "Any demographic difference in the selected tracts reflects structural co-variation between "
        "adult uninsurance (PLACES 18-64), zero-vehicle household prevalence (CDC SVI), and spatial "
        "distance to federally recognized safety-net clinics across Fulton County."
    )

    result = AuditEquity(
        table=table,
        finding=finding,
        structural_hypothesis=structural_hypothesis,
    )
    return result.model_dump(mode="json")



def find_equity_passing_set(n: int = 4, min_spacing_km: float = 5.0, top_k: int = 15,
                            threshold: float = 0.8) -> dict[str, Any]:
    # AUDITOR-SIDE ONLY (may read demographics; the Planner never calls this).
    # Search all n-stop sets among the top_k need-ranked tracts, spaced >= min_spacing_km,
    # and return the highest total-need set whose uninsured-weighted shares pass the
    # four-fifths rule for every group. Same logic as scripts/pick4.py.
    import itertools
    from .scoring import haversine_km
    rows = call_toolbox_tool("get_need_ranking", {"limit": 100})
    rows = sorted(rows, key=lambda r: (int(r.get("need_rank", 999999)), -float(r.get("need_score", 0.0))))[:top_k]
    ids = [str(r["tract_id"]).strip().zfill(11) for r in rows]
    demo = {str(d["tract_id"]).strip().zfill(11): d
            for d in call_toolbox_tool("get_tract_demographics", {"tract_ids": ",".join(ids)})}
    v2 = {r["grp"]: r for r in call_toolbox_tool("get_equity_audit_v2", {"tract_ids": ids[0]})}
    county = v2.get("county_uninsured", {})
    keys = {"black": ("black_pop", "pct_black"), "hispanic": ("hispanic_pop", "pct_hispanic"),
            "white": ("white_pop", "pct_white"), "asian": ("asian_pop", "pct_asian")}
    cshare = {g: float(county.get(k[1]) or 0.0) / 100.0 for g, k in keys.items()}
    cand = []
    for r in rows:
        tid = str(r["tract_id"]).strip().zfill(11)
        d = demo.get(tid)
        if not d or not d.get("total_pop") or r.get("latitude") is None:
            continue
        tp = float(d["total_pop"])
        cand.append({"tid": tid, "lat": float(r["latitude"]), "lon": float(r["longitude"]),
                     "need": float(r["need_score"]), "w": tp * float(r.get("pct_uninsured") or 0.0) / 100.0,
                     "s": {g: float(d.get(k[0]) or 0.0) / tp for g, k in keys.items()}})
    best, tested = None, 0
    for combo in itertools.combinations(cand, n):
        if any(haversine_km(x["lat"], x["lon"], y["lat"], y["lon"]) < min_spacing_km
               for x, y in itertools.combinations(combo, 2)):
            continue
        tested += 1
        W = sum(c["w"] for c in combo)
        if W <= 0:
            continue
        ratios = {g: (sum(c["w"] * c["s"][g] for c in combo) / W) / cshare[g] for g in cshare if cshare[g] > 0}
        if min(ratios.values()) < threshold:
            continue
        need = sum(c["need"] for c in combo)
        if best is None or need > best[0]:
            best = (need, combo, ratios)
    if best is None:
        return {"found": False, "searched_top_k": top_k, "combos_tested": tested}
    need, combo, ratios = best
    ordered = sorted(combo, key=lambda c: -c["need"])
    return {"found": True, "tract_ids": [c["tid"] for c in ordered], "total_need": round(need, 3),
            "ratios": {k: round(v, 2) for k, v in ratios.items()},
            "searched_top_k": top_k, "combos_tested": tested}
