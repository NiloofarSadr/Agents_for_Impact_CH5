"""Clinic Van Planner multi-agent package (Fulton County, GA - FIPS 13121)."""

import os

if not os.environ.get("GEMINI_API_KEY"):
    os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "true")
    os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "qwiklabs-gcp-04-26e02fd45203")
    os.environ.setdefault("GOOGLE_CLOUD_LOCATION", "global")

from .contract import (
    COUNTY_FIPS,
    COUNTY_NAME,
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
    Claim,
    ClinicPlan,
    DisagreementEntry,
    EquityGroupComparison,
    Evidence,
    Kind,
    Outreach,
    PlanDraft,
    ProblemType,
    Scale,
    SitePick,
)

__all__ = [
    "COUNTY_FIPS",
    "COUNTY_NAME",
    "MODEL_NAME",
    "STATE_EV_BURDEN",
    "STATE_EV_ACCESS",
    "STATE_EV_CONTEXT",
    "STATE_LIMITS",
    "STATE_PLAN_DRAFT",
    "STATE_AUDIT_REVISIONS",
    "STATE_AUDIT_EQUITY",
    "STATE_AUDIT_STATUS",
    "STATE_PLAN_FINAL",
    "STATE_DISAGREEMENT_LOG",
    "STATE_OUTREACH",
    "STATE_REVISE_ROUND",
    "STATE_DRAFT_HISTORY",
    "STATE_REVISION_HISTORY",
    "Scale",
    "Kind",
    "Claim",
    "Evidence",
    "SitePick",
    "PlanDraft",
    "ProblemType",
    "AuditRevision",
    "AuditStatus",
    "EquityGroupComparison",
    "AuditEquity",
    "Outreach",
    "DisagreementEntry",
    "ClinicPlan",
    "root_agent",
]

from .agent import root_agent

