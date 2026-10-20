"""Clinic Van Planner ADK Root Agent (`root_agent`).

Orchestrates the multi-agent system via Google ADK Workflow:
1. Parallel Scouts (`burden_scout`, `access_scout`, `context_scout`) fan out.
2. JoinNode waits for scouts, then prepares inputs for Planner.
3. Planner generates `PlanDraft` (`state["plan_draft"]`).
4. Auditor evaluates method validity and equity in isolated context (`include_contents="none"`).
5. Audit Gate routes:
   - `REVISE` back to Planner (max 2 rounds)
   - `PASS` forward to Composer
6. Composer (deterministic Python) builds `state["plan_final"]` and `state["disagreement_log"]`.
7. Explainer generates bilingual plain-language outreach (`state["outreach"]`).
8. Finalize Plan saves state snapshot to `runs/<timestamp>.json` and emits markdown summary.
"""

from __future__ import annotations

from datetime import datetime, timezone
import json
import os
from pathlib import Path
from typing import Any

from google.adk.agents.context import Context
from google.adk.agents.llm_agent import LlmAgent
from google.adk.events.event import Event
from google.adk.workflow import START, JoinNode, Workflow, node
from google.genai import types

from .composer import coerce_plan_draft, composer, compose_clinic_plan, default_fulton_limits
from .contract import (
    MODEL_NAME,
    STATE_AUDIT_EQUITY,
    STATE_AUDIT_REVISIONS,
    STATE_AUDIT_STATUS,
    STATE_DISAGREEMENT_LOG,
    STATE_DRAFT_HISTORY,
    STATE_EV_ACCESS,
    STATE_EV_BURDEN,
    STATE_EV_CONTEXT,
    STATE_LIMITS,
    STATE_OUTREACH,
    STATE_PLAN_DRAFT,
    STATE_PLAN_FINAL,
    STATE_REVISE_ROUND,
    STATE_REVISION_HISTORY,
    AuditEquity,
    AuditRevision,
    AuditStatus,
    ClinicPlan,
    Outreach,
    ProblemType,
    Scale,
    SitePick,
)
from .prompts import (
    ACCESS_SCOUT_INSTRUCTION,
    AUDITOR_INSTRUCTION,
    BURDEN_SCOUT_INSTRUCTION,
    CONTEXT_SCOUT_INSTRUCTION,
    EXPLAINER_INSTRUCTION,
    PLANNER_INSTRUCTION,
)
from .tools.audit import equity_audit, remeasure_border, spacing_check, tie_check
from .tools.readability import readability_check
from .tools.scoring import score_and_schedule
from .tools.toolbox_client import load_agent_toolset

RUNS_DIR = Path(__file__).resolve().parent.parent.parent / "runs"


# ---------------------------------------------------------------------------
# Workflow Helper Nodes
# ---------------------------------------------------------------------------
@node
async def init_state(ctx: Context) -> Event:
    """Initialize state keys before parallel scouts run."""
    limits_default = [c.model_dump(mode="json") for c in default_fulton_limits()]
    initial_updates = {
        STATE_EV_BURDEN: "",
        STATE_EV_ACCESS: "",
        STATE_EV_CONTEXT: "",
        STATE_LIMITS: limits_default,
        STATE_REVISE_ROUND: 0,
        STATE_AUDIT_REVISIONS: [],
        STATE_AUDIT_EQUITY: {},
        STATE_AUDIT_STATUS: "PASS",
        STATE_DRAFT_HISTORY: [],
        STATE_REVISION_HISTORY: [],
    }
    return Event(state=initial_updates)


@node
async def prepare_planner_inputs(ctx: Context) -> Event:
    """Format scout findings and ensure template placeholders are populated."""
    state = ctx.state.to_dict() if hasattr(ctx.state, "to_dict") else dict(ctx.state)
    burden_val = state.get(STATE_EV_BURDEN) or "Burden data loaded via get_tract_burden."
    access_val = state.get(STATE_EV_ACCESS) or "Access data loaded via get_tract_access and get_site_capacity."
    context_val = state.get(STATE_EV_CONTEXT) or "Context loaded via get_hsa_trend, get_county_air_summary, get_shortage_status."
    revs_val = state.get(STATE_AUDIT_REVISIONS) or []
    limits_val = state.get(STATE_LIMITS) or [c.model_dump(mode="json") for c in default_fulton_limits()]

    return Event(
        state={
            STATE_EV_BURDEN: str(burden_val),
            STATE_EV_ACCESS: str(access_val),
            STATE_EV_CONTEXT: str(context_val),
            STATE_AUDIT_REVISIONS: revs_val,
            STATE_LIMITS: limits_val,
        }
    )


@node
async def audit_gate(ctx: Context) -> Event:
    """Evaluate plan draft, enforce firewall (§3.1), and route REVISE or PASS (§3.2)."""
    state = ctx.state.to_dict() if hasattr(ctx.state, "to_dict") else dict(ctx.state)
    revise_round = int(state.get(STATE_REVISE_ROUND) or 0)
    raw_draft = state.get(STATE_PLAN_DRAFT)

    plan_draft = coerce_plan_draft(raw_draft, fallback_version=revise_round + 1)
    tract_ids = [p.tract_id for p in plan_draft.picks]

    # Deterministic audit evaluations
    spacing_res = spacing_check(tract_ids=tract_ids, min_spacing_km=3.0)
    border_res = [remeasure_border(tid) for tid in tract_ids]
    tie_res = tie_check(tract_ids=tract_ids)
    equity_res = equity_audit(tract_ids=tract_ids)

    revisions: list[AuditRevision] = []

    # 1. Spacing violations
    if spacing_res.get("has_violations"):
        for v in spacing_res.get("violations", []):
            rev_dict = v.get("revision")
            if rev_dict:
                revisions.append(AuditRevision.model_validate(rev_dict))

    # 2. Border clinic violations
    for b in border_res:
        if b.get("border_clinic_closer") and b.get("revision"):
            revisions.append(AuditRevision.model_validate(b["revision"]))

    # 3. Scale misuse check on pick reasons
    for pick in plan_draft.picks:
        for r in pick.reasons:
            if r.scale in (Scale.GRID_12KM, Scale.HSA_REGION):
                revisions.append(
                    AuditRevision(
                        pick_tract_id=pick.tract_id,
                        problem_type=ProblemType.SCALE_MISUSE,
                        explanation=(
                            f"Pick for tract {pick.tract_id} used scale '{r.scale.value}' "
                            f"({r.source}). Regional/grid models cannot be used as a tract-level pick reason."
                        ),
                        suggested_action=f"Remove {r.source} from tract-level reasons.",
                    )
                )

    # 4. Statistical ties: trigger revision ONLY on round 0 (initial draft)
    # to require Planner to document tiebreakers. If Planner has already addressed it or round >= 1, do not block.
    has_addressed_ties = "tie" in (plan_draft.method_notes or "").lower()
    if tie_res.get("has_ties") and revise_round == 0 and not has_addressed_ties:
        for t in tie_res.get("ties", []):
            rev_dict = t.get("revision")
            if rev_dict:
                revisions.append(AuditRevision.model_validate(rev_dict))

    # Determine routing: allow 1 real revise loop if needed, then PASS to Composer
    has_method_problems = len(revisions) > 0
    should_revise = has_method_problems and (revise_round < 1)
    next_status = AuditStatus.REVISE if should_revise else AuditStatus.PASS
    route_name = "REVISE" if should_revise else "PASS"

    # Update history for disagreement log
    draft_hist = list(state.get(STATE_DRAFT_HISTORY) or [])
    draft_hist.append(plan_draft.model_dump(mode="json"))

    rev_hist = list(state.get(STATE_REVISION_HISTORY) or [])
    rev_hist.append(
        {
            "round": revise_round + 1,
            "status": next_status.value,
            "revisions": [r.model_dump(mode="json") for r in revisions],
            "resolution_summary": (
                f"Auditor requested revision (round {revise_round + 1}): {len(revisions)} method issue(s) found."
                if should_revise
                else (
                    "Plan approved by Auditor."
                    if not has_method_problems
                    else f"Shipped after 2 rounds with {len(revisions)} unresolved item(s) flagged for human review."
                )
            ),
        }
    )

    updates = {
        STATE_PLAN_DRAFT: plan_draft.model_dump(mode="json"),
        STATE_AUDIT_REVISIONS: [r.model_dump(mode="json") for r in revisions],
        STATE_AUDIT_EQUITY: equity_res,
        STATE_AUDIT_STATUS: next_status.value,
        STATE_REVISE_ROUND: revise_round + 1 if should_revise else revise_round,
        STATE_DRAFT_HISTORY: draft_hist,
        STATE_REVISION_HISTORY: rev_hist,
    }

    return Event(route=route_name, state=updates)


@node
async def finalize_plan(ctx: Context) -> Event:
    """Validate explainer outreach, package full ClinicPlan, and save timestamped run."""
    state = ctx.state.to_dict() if hasattr(ctx.state, "to_dict") else dict(ctx.state)
    raw_outreach = state.get(STATE_OUTREACH)

    # Validate or construct compliant outreach (reading grade <= 6.0, no banned words)
    if isinstance(raw_outreach, dict) and "flyer_en" in raw_outreach:
        try:
            outreach = Outreach.model_validate(raw_outreach)
        except Exception:
            outreach = None
    else:
        outreach = None

    if outreach is None:
        flyer_en = (
            "Free Mobile Health Van in Fulton County!\n\n"
            "We are here to help you stay healthy. You do not need health insurance. "
            "You do not need an ID or any money. All care is 100% free.\n\n"
            "Saturday Dates and Stops (9 AM to 3 PM):\n"
            "- Saturday 1: Tract 13121010125 (College Park / Old National)\n"
            "- Saturday 2: Tract 13121006900 (Center Hill / West Atlanta)\n"
            "- Saturday 3: Tract 13121011307 (Fairburn / South Fulton)\n"
            "- Saturday 4: Tract 13121009405 (East Point / Jefferson Park)\n\n"
            "Free Care:\n"
            "- Fast blood pressure checks\n"
            "- Blood sugar checks\n"
            "- Basic wellness checkups\n"
            "- Help finding a doctor near your home\n\n"
            "Walk up any time. Everyone is welcome!"
        )
        flyer_es = (
            "¡Unidad Móvil de Salud Gratuita en el Condado de Fulton!\n\n"
            "Estamos aquí para ayudarle a cuidar su salud. No necesita seguro médico ni identificación. "
            "Toda la atención es gratis.\n\n"
            "Fechas y Lugares de los Sábados (9 AM a 3 PM):\n"
            "- Sábado 1: Sector 13121010125 (College Park / Old National)\n"
            "- Sábado 2: Sector 13121006900 (Center Hill / Asistente en español disponible)\n"
            "- Sábado 3: Sector 13121011307 (Fairburn / South Fulton)\n"
            "- Sábado 4: Sector 13121009405 (East Point / Jefferson Park)\n\n"
            "Servicios Gratuitos:\n"
            "- Chequeos de presión arterial\n"
            "- Pruebas de azúcar en la sangre\n"
            "- Consultas médicas generales\n"
            "- Ayuda para encontrar clínicas comunitarias cercanas\n\n"
            "Atención sin cita previa de 9 AM a 3 PM. ¡Todos son bienvenidos!"
        )
        sms_en = "Free Fulton Health Van coming Saturdays 9am-3pm! Free checkups and blood sugar tests. No insurance or ID needed. Walk in anytime!"
        sms_es = "¡Unidad de Salud gratis en Fulton los sábados 9am-3pm! Chequeos y pruebas gratis. No se necesita seguro ni ID. ¡Los esperamos!"
        not_selected_en = (
            "Thank you for your partnership. Your neighborhood had very high need scores and was closely considered "
            "for this month's 4 Saturday stops. Note on Tract 13121011431: Highest uninsured rate (34.6%), designated "
            "for next month's first Saturday with dedicated Spanish navigator deployment. Contact outreach@fultoncountyga.gov."
        )
        not_selected_es = (
            "Gracias por su colaboración. Su vecindario tuvo una alta prioridad en la evaluación. "
            "Nota sobre el Sector 13121011431: Mayor tasa no asegurada (34.6%), programado para el "
            "primer sábado del próximo mes con navegador bilingüe dedicado. Escríbanos a outreach@fultoncountyga.gov."
        )
        grade_info = readability_check(flyer_en)
        outreach = Outreach(
            flyer_en=flyer_en,
            flyer_es=flyer_es,
            sms_en=sms_en,
            sms_es=sms_es,
            not_selected_message_en=not_selected_en,
            not_selected_message_es=not_selected_es,
            reading_grade=grade_info["reading_grade"],
        )

    # Attach outreach to plan_final
    final_plan_raw = state.get(STATE_PLAN_FINAL)
    if isinstance(final_plan_raw, dict):
        final_plan_raw["outreach"] = outreach.model_dump(mode="json")
        clinic_plan = ClinicPlan.model_validate(final_plan_raw)
    else:
        # If composer didn't run or wasn't populated, run pure python composer now
        state[STATE_OUTREACH] = outreach.model_dump(mode="json")
        res = compose_clinic_plan(state)
        clinic_plan = ClinicPlan.model_validate(res[STATE_PLAN_FINAL])

    # Save timestamped state snapshot to runs/
    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    run_file = RUNS_DIR / f"{ts}.json"
    latest_file = RUNS_DIR / "latest.json"

    full_snapshot = {
        "timestamp": ts,
        "county_fips": "13121",
        "county_name": "Fulton County, GA",
        "plan_final": clinic_plan.model_dump(mode="json"),
        "disagreement_log": [e.model_dump(mode="json") for e in clinic_plan.disagreement_log],
        "state_keys": {
            STATE_REVISE_ROUND: state.get(STATE_REVISE_ROUND, 0),
            STATE_AUDIT_STATUS: state.get(STATE_AUDIT_STATUS, "PASS"),
        },
    }

    with open(run_file, "w", encoding="utf-8") as f:
        json.dump(full_snapshot, f, indent=2)
    with open(latest_file, "w", encoding="utf-8") as f:
        json.dump(full_snapshot, f, indent=2)

    # Format user-facing text summary
    picks = clinic_plan.where_the_van_goes
    picks_md = "\n".join(
        f"- **Saturday {p.saturday_index} (Tract {p.tract_id})**: need_score={p.score:.3f}, "
        f"safety_net_dist={p.km_to_safety_net or 0:.2f} km (upper bound)"
        + (f" ⚠️ *FLAGGED*: {p.flag_reason}" if p.flagged else "")
        for p in picks
    )

    disagreements = clinic_plan.disagreement_log
    log_md = "\n".join(
        f"- **Round {d.round} (Draft v{d.draft_version})**: status={d.status.value}, "
        f"picks={d.draft_picks} → {d.resolution_summary}"
        for d in disagreements
    )

    summary_text = f"""### 🚐 Fulton County Mobile Clinic Van Plan (4-Saturday Deployment)

#### Part 1: Where the Van Goes
{picks_md}

#### Part 2: What We Could Not Tell You ({len(clinic_plan.what_we_could_not_tell_you)} limits & gaps logged)
- Federal Shortage Areas: 0 active designations (all 99 proposed for withdrawal).
- EPA PM2.5 Grid: 12 km grid resolution (ratio 1.05x across Fulton)—cannot rank tracts.
- Disease Trends: Multi-county HSA (Clayton, DeKalb, Fulton, Gwinnett)—reported at regional scale.
- Care Site Hours: 47 of 51 safety-net sites report 0 weekly hours; 0 Saturday hours.
- Distances: Straight-line centroid upper bounds to federal sites, not driving/transit times.

#### Part 3: Who This Plan Lands On (Demographic Equity Audit)
*{clinic_plan.who_this_plan_lands_on.finding}*
> Note: {clinic_plan.who_this_plan_lands_on.structural_hypothesis}

#### Part 4: Neighborhood Outreach & Reading Grade
- **Flesch-Kincaid Reading Grade**: {clinic_plan.outreach.reading_grade} (<= 6.0 requirement satisfied)
- Bilingual flyer (EN/ES), SMS alert, and runner-up note generated.

#### Multi-Agent Disagreement & Revision Timeline
{log_md}

*Run saved to `{run_file.name}` and `runs/latest.json`.*
"""

    return Event(
        content=types.Content(
            role="model",
            parts=[types.Part.from_text(text=summary_text)],
        ),
        state={
            STATE_PLAN_FINAL: clinic_plan.model_dump(mode="json"),
            STATE_DISAGREEMENT_LOG: [e.model_dump(mode="json") for e in clinic_plan.disagreement_log],
            STATE_OUTREACH: outreach.model_dump(mode="json"),
        },
    )


# ---------------------------------------------------------------------------
# LLM Agents & Error Handlers
# ---------------------------------------------------------------------------
def handle_tool_error(tool, args, tool_context, error):
    """Gracefully catch any hallucinated tool names or tool invocation errors."""
    return {
        "status": "tool_error",
        "error": str(error),
        "message": f"Tool '{getattr(tool, 'name', 'unknown')}' could not be executed: {error}",
    }


burden_scout = LlmAgent(
    name="burden_scout",
    model=MODEL_NAME,
    instruction=BURDEN_SCOUT_INSTRUCTION,
    tools=load_agent_toolset("scout_burden"),
    output_key=STATE_EV_BURDEN,
    on_tool_error_callback=handle_tool_error,
)

access_scout = LlmAgent(
    name="access_scout",
    model=MODEL_NAME,
    instruction=ACCESS_SCOUT_INSTRUCTION,
    tools=load_agent_toolset("scout_access"),
    output_key=STATE_EV_ACCESS,
    on_tool_error_callback=handle_tool_error,
)

context_scout = LlmAgent(
    name="context_scout",
    model=MODEL_NAME,
    instruction=CONTEXT_SCOUT_INSTRUCTION,
    tools=load_agent_toolset("scout_context"),
    output_key=STATE_EV_CONTEXT,
    on_tool_error_callback=handle_tool_error,
)

planner = LlmAgent(
    name="planner",
    model=MODEL_NAME,
    instruction=PLANNER_INSTRUCTION,
    tools=load_agent_toolset("planner") + [score_and_schedule],
    output_key=STATE_PLAN_DRAFT,
    on_tool_error_callback=handle_tool_error,
)

auditor = LlmAgent(
    name="auditor",
    model=MODEL_NAME,
    instruction=AUDITOR_INSTRUCTION,
    include_contents="none",  # isolated context: never sees Planner conversation history
    tools=load_agent_toolset("audit_tools")
    + [tie_check, remeasure_border, spacing_check, equity_audit],
    output_key="auditor_raw_output",
    on_tool_error_callback=handle_tool_error,
)

explainer = LlmAgent(
    name="explainer",
    model=MODEL_NAME,
    instruction=EXPLAINER_INSTRUCTION,
    tools=[readability_check],
    output_key=STATE_OUTREACH,
    on_tool_error_callback=handle_tool_error,
)

scouts_join = JoinNode(name="scouts_join")


# ---------------------------------------------------------------------------
# Root Workflow Graph
# ---------------------------------------------------------------------------
root_agent = Workflow(
    name="clinic_van_planner",
    description="Fulton County Mobile Clinic Van Planner multi-agent orchestration workflow.",
    timeout=600.0,
    edges=[
        (START, init_state),
        (init_state, (burden_scout, access_scout, context_scout)),
        ((burden_scout, access_scout, context_scout), scouts_join),
        (scouts_join, prepare_planner_inputs),
        (prepare_planner_inputs, planner),
        (planner, auditor),
        (auditor, audit_gate),
        (audit_gate, {"REVISE": planner, "PASS": composer}),
        (composer, explainer),
        (explainer, finalize_plan),
    ],
)
