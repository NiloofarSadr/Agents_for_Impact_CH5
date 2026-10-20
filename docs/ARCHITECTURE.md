# Clinic Van Planner Architecture

## 1. System Overview

The **Clinic Van Planner** is a multi-agent system built with **Google ADK (Python)** for Fulton County (GA, FIPS `13121`). It produces a 4-part **Clinic Plan** determining where to park a mobile health clinic van on four Saturdays next month, why, what scale limits exist, who the plan lands on, and plain-language bilingual neighborhood outreach copy.

```
User Request
     │
     ▼
[Parallel Scouts]
  ├── Burden Scout   → state["ev_burden"]
  ├── Access Scout   → state["ev_access"]
  └── Context Scout  → state["ev_context"], state["limits"]
     │
     ▼
Scouts Join Node (waits for all 3 scouts)
     │
     ▼
Planner ───────────────────► state["plan_draft"]
     ▲                               │
     │ (REVISE route,                ▼
     │  max 2 rounds)         Auditor (include_contents="none")
     │                               ├── state["audit_revisions"] ──► read by Planner
     └────────── Audit Gate ─────────┤
                 (evaluates rules)   ├── state["audit_equity"]    ──► read by Composer ONLY
                                     └── route: REVISE | PASS
                                             │
                                             ▼ (PASS route)
Composer (Deterministic Python) ────► state["plan_final"], state["disagreement_log"]
     │
     ▼
Explainer (Bilingual Plain Language) ─► state["outreach"]
     │
     ▼
Finalize Plan ──────────────────────► runs/<timestamp>.json & UI response
```

## 2. The Demographic Firewall (§3.1)

The firewall is the core architectural safeguard enforcing place-based need planning without demographic bias:
- **Storage Isolation**: Race and ethnicity counts are stored in a dedicated dataset (`a4i_audit.tract_demographics`) completely separate from clinical and access data (`a4i_health`).
- **Tool Isolation**: Only the Auditor is provisioned with the `audit_tools` toolset (`get_tract_demographics`, `get_county_demographics`). The Planner never receives demographic tools.
- **Prompt & History Isolation**: The Planner prompt never contains demographic references or `audit_equity`. The Auditor runs with `include_contents="none"`, seeing only the candidate tract IDs and claims in `plan_draft`, never the Planner's reasoning.
- **Feedback Firewall**: The Auditor sends only method revisions back to the Planner (`TOO_CLOSE_TOGETHER`, `BORDER_CLINIC_CLOSER`, `STATISTICAL_TIE`, `SCALE_MISUSE`). Equity audit findings are routed strictly to the Composer and human outreach director, never back to the Planner.

## 3. Data Contract & State Passing

Every number the system states is modeled as a Pydantic v2 `Claim` carrying explicit `Scale` and `Kind` enums:
- `Scale`: `tract`, `grid_12km`, `hsa_region`, `facility_point`, `fed_designation`, `county`
- `Kind`: `modeled`, `survey`, `computed_upper_bound`, `reported`

State passing uses typed constants in `agent/clinic_broker/contract.py` (`STATE_EV_BURDEN`, `STATE_EV_ACCESS`, `STATE_EV_CONTEXT`, `STATE_LIMITS`, `STATE_PLAN_DRAFT`, `STATE_AUDIT_REVISIONS`, `STATE_AUDIT_EQUITY`, `STATE_AUDIT_STATUS`, `STATE_PLAN_FINAL`, `STATE_DISAGREEMENT_LOG`, `STATE_OUTREACH`).

## 4. MCP Server & Custom Tools

- **Google MCP Toolbox for Databases** (`agent/toolbox/tools.yaml`): Runs locally on port 5000, connecting to BigQuery to execute 10 parameterized SQL tools across 5 toolsets (`scout_burden`, `scout_access`, `scout_context`, `planner`, `audit_tools`).
- **Deterministic Python Tools**:
  - `score_and_schedule`: Greedy spatial allocation enforcing `min_spacing_km=3.0`.
  - `spacing_check`: Identifies pairwise tract centroid spacing violations under 3.0 km.
  - `tie_check`: Flags statistical ties within 5% `need_score` threshold (`approximate, no CI loaded`).
  - `remeasure_border`: Detects closer out-of-county safety-net clinics in Georgia (< 3.0 km).
  - `equity_audit`: Compares population-weighted demographic shares of selected tracts against countywide census benchmarks.
  - `readability_check`: Computes Flesch-Kincaid reading grade (<= 6.0) and enforces zero banned hedging words (`modeled`, `estimate`, `estimated`, `percentile`, `confidence`).

