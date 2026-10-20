"""Data contract and state key constants for the Clinic Van Planner multi-agent system.

Every number the system states is represented as a `Claim` carrying explicit `Scale`
and `Kind` tags so resolution boundaries are preserved end-to-end.
"""

from __future__ import annotations

import os
from enum import Enum
from pydantic import BaseModel, Field, field_validator

# ---------------------------------------------------------------------------
# Fixed model & county constants
# ---------------------------------------------------------------------------
# Defaults to gemini-2.5-flash on Vertex AI (or gemini-3.6-flash if specified via env)
MODEL_NAME: str = os.environ.get("MODEL_NAME", "gemini-2.5-flash")
COUNTY_FIPS: str = "13121"
COUNTY_NAME: str = "Fulton County, GA"

# ---------------------------------------------------------------------------
# Session state key constants (no raw string literals elsewhere)
# ---------------------------------------------------------------------------
STATE_EV_BURDEN: str = "ev_burden"
STATE_EV_ACCESS: str = "ev_access"
STATE_EV_CONTEXT: str = "ev_context"
STATE_LIMITS: str = "limits"
STATE_PLAN_DRAFT: str = "plan_draft"
STATE_AUDIT_REVISIONS: str = "audit_revisions"
STATE_AUDIT_EQUITY: str = "audit_equity"
STATE_AUDIT_STATUS: str = "audit_status"
STATE_PLAN_FINAL: str = "plan_final"
STATE_DISAGREEMENT_LOG: str = "disagreement_log"
STATE_OUTREACH: str = "outreach"
STATE_REVISE_ROUND: str = "revise_round"
STATE_DRAFT_HISTORY: str = "draft_history"
STATE_REVISION_HISTORY: str = "revision_history"


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------
class Scale(str, Enum):
    TRACT = "tract"                     # census tract (~4,000 people)
    GRID_12KM = "grid_12km"             # EPA PM2.5 model grid wearing a tract ID
    HSA_REGION = "hsa_region"           # multi-county Health Service Area (disease_weekly)
    FACILITY_POINT = "facility_point"   # a clinic location
    FED_DESIGNATION = "fed_designation" # HRSA shortage designation polygon
    COUNTY = "county"


class Kind(str, Enum):
    MODELED = "modeled"                            # CDC PLACES estimate
    SURVEY = "survey"                              # CDC SVI / ACS survey estimate
    COMPUTED_UPPER_BOUND = "computed_upper_bound"  # straight-line distance to nearest FEDERAL site
    REPORTED = "reported"                          # federal designation / surveillance report


class ProblemType(str, Enum):
    SCALE_MISUSE = "SCALE_MISUSE"
    STATISTICAL_TIE = "STATISTICAL_TIE"
    BORDER_CLINIC_CLOSER = "BORDER_CLINIC_CLOSER"
    TOO_CLOSE_TOGETHER = "TOO_CLOSE_TOGETHER"
    DATA_GAP = "DATA_GAP"
    EQUITY_FLAG = "EQUITY_FLAG"


class AuditStatus(str, Enum):
    PASS = "PASS"
    REVISE = "REVISE"


# ---------------------------------------------------------------------------
# Core Data Models (Pydantic v2)
# ---------------------------------------------------------------------------
class Claim(BaseModel):
    claim: str            # plain sentence
    value: float | str | None = None
    unit: str | None = None
    tract_id: str | None = None  # 11-char string, zero-padded
    scale: Scale
    kind: Kind
    source: str           # table.column

    @field_validator("tract_id")
    @classmethod
    def validate_tract_id(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v_str = str(v).strip().zfill(11)
        if len(v_str) != 11 or not v_str.isdigit():
            raise ValueError(f"tract_id must be an 11-digit zero-padded string, got {v!r}")
        return v_str


class Evidence(BaseModel):
    claims: list[Claim] = Field(default_factory=list)
    notes: str = ""
    limits: list[Claim] = Field(default_factory=list)


class SitePick(BaseModel):
    rank: int = Field(ge=1)
    saturday_index: int = Field(ge=1, le=4)
    tract_id: str
    score: float
    reasons: list[Claim]
    flagged: bool = False
    flag_reason: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    km_to_safety_net: float | None = None

    @field_validator("tract_id")
    @classmethod
    def validate_tract_id(cls, v: str) -> str:
        v_str = str(v).strip().zfill(11)
        if len(v_str) != 11 or not v_str.isdigit():
            raise ValueError(f"tract_id must be an 11-digit zero-padded string, got {v!r}")
        return v_str


class PlanDraft(BaseModel):
    version: int = Field(ge=1)
    picks: list[SitePick]
    method_notes: str


class AuditRevision(BaseModel):
    pick_tract_id: str
    problem_type: ProblemType
    explanation: str
    suggested_action: str

    @field_validator("pick_tract_id")
    @classmethod
    def validate_pick_tract_id(cls, v: str) -> str:
        v_str = str(v).strip().zfill(11)
        if len(v_str) != 11 or not v_str.isdigit():
            raise ValueError(f"pick_tract_id must be an 11-digit zero-padded string, got {v!r}")
        return v_str


class EquityGroupComparison(BaseModel):
    group: str
    plan_population: int
    plan_share_pct: float
    county_population: int
    county_share_pct: float
    diff_pct_points: float
    audit_ratio: float | None = None
    flagged: bool = False


class AuditEquity(BaseModel):
    table: list[EquityGroupComparison]
    finding: str
    structural_hypothesis: str


class Outreach(BaseModel):
    flyer_en: str
    flyer_es: str
    sms_en: str
    sms_es: str
    not_selected_message_en: str
    not_selected_message_es: str
    reading_grade: float


class DisagreementEntry(BaseModel):
    round: int
    draft_version: int
    draft_picks: list[str]
    status: AuditStatus
    revisions: list[AuditRevision] = Field(default_factory=list)
    resolution_summary: str = ""


class ClinicPlan(BaseModel):
    """The 4-part Clinic Plan artifact plus the Planner-Auditor disagreement timeline."""

    county_fips: str = COUNTY_FIPS
    county_name: str = COUNTY_NAME
    # Part 1: Where the van goes (4 census tracts, ranked, each with a reason and numbers)
    where_the_van_goes: list[SitePick]
    # Part 2: What we could not tell you (data gaps and scale limits, named and counted)
    what_we_could_not_tell_you: list[Claim]
    # Part 3: Who this plan lands on (equity audit against demographics planner could not use)
    who_this_plan_lands_on: AuditEquity
    # Part 4: The flyer (English + Spanish, plain language)
    outreach: Outreach
    # Timeline of Planner-Auditor disagreement and resolution
    disagreement_log: list[DisagreementEntry] = Field(default_factory=list)

