"""
contract.py — Source of truth for Fulton County Clinic Van Planner (`session.state` keys).
Owner: Role 1 (Anish)
All agents read/write strictly through these keys on `session.state`.
Rule 4: Every number carries `scale` ("census_tract" | "grid_12km" | "multi_county_4")
        and `method` ("measured" | "modeled").
Rule 5: Race/demographic data lives ONLY in `audit_equity` (never seen by Scouts or Planner).
"""

from typing import TypedDict, Literal, List

ScaleType = Literal["census_tract", "grid_12km", "multi_county_4"]
MethodType = Literal["measured", "modeled"]


class LabeledMetric(TypedDict):
    key: str
    label: str
    value: str
    numeric_value: float
    unit: str
    county_avg: str
    scale: ScaleType
    method: MethodType
    source: str
    agent_owner: Literal["burden_scout", "access_scout", "context_scout"]


class ExecutionAdvisory(TypedDict):
    id: str
    category: Literal["public_event", "road_work", "transit", "weather_holiday", "co_location"]
    severity: Literal["opportunity", "caution", "critical"]
    title: str
    window: str
    impact_summary: str
    coordinator_action: str


class TractRecommendation(TypedDict):
    rank: int
    saturday_date: str
    tract_fips: str
    neighborhood_name: str
    site_name: str
    site_address: str
    need_score: float
    confidence_interval: str
    status: Literal["approved_round_1", "promoted_round_2", "rejected_round_1"]
    planner_summary: str
    agent_consensus_notes: List[str]
    metrics: List[LabeledMetric]
    execution_advisories: List[ExecutionAdvisory]


class AuditRevision(TypedDict):
    round_number: int
    rejected_tract_fips: str
    rejected_neighborhood: str
    violation_type: Literal["border_clinic_proximity", "statistical_tie", "scale_mismatch"]
    auditor_finding: str
    replacement_tract_fips: str
    replacement_neighborhood: str
    planner_resolution: str


class SessionStateContract(TypedDict):
    ev_burden: dict      # Written by Burden Scout (no race data)
    ev_access: dict      # Written by Access Scout (no race data)
    ev_context: dict     # Written by Context Scout (no race data)
    plan_draft: dict     # Written by Planner (4 Saturday picks + reasons)
    audit_revisions: List[AuditRevision]  # Written by Auditor (method objections only, max 2 rounds)
    audit_equity: dict   # Written by Auditor for HUMAN ONLY (never fed back to Planner)
    outreach: dict       # Written by Explainer (warm EN/ES/VI flyer, zero jargon)


SESSION_STATE_KEYS = [
    "ev_burden",
    "ev_access",
    "ev_context",
    "plan_draft",
    "audit_revisions",
    "audit_equity",
    "outreach",
]
