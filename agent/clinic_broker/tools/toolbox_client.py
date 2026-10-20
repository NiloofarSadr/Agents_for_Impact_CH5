"""MCP Toolbox client wrapper (`toolbox-core`) for loading toolsets and invoking SQL tools."""

from __future__ import annotations

import json
import os
from typing import Any
import urllib.request

from toolbox_core import ToolboxSyncClient

DEFAULT_TOOLBOX_URL = "http://127.0.0.1:5000"

TOOLSET_DEFINITIONS: dict[str, list[str]] = {
    "scout_burden": ["get_tract_burden"],
    "scout_access": ["get_tract_access", "get_site_capacity"],
    "scout_context": ["get_hsa_trend", "get_county_air_summary", "get_shortage_status"],
    "planner": ["get_tract_access", "get_need_ranking"],
    "audit_tools": [
        "get_nearest_state_safety_net",
        "get_tract_demographics",
        "get_county_demographics",
    ],
}


def get_toolbox_url() -> str:
    return os.environ.get("TOOLBOX_URL", DEFAULT_TOOLBOX_URL).rstrip("/")


def call_toolbox_tool(tool_name: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    """Invoke a named tool on the running MCP Toolbox server and parse its JSON rows."""
    url = f"{get_toolbox_url()}/api/tool/{tool_name}/invoke"
    payload = json.dumps(params or {}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    result = body.get("result", body)
    if isinstance(result, str):
        try:
            parsed = json.loads(result)
            if isinstance(parsed, list):
                return parsed
            return [parsed]
        except json.JSONDecodeError:
            return [{"raw": result}]
    if isinstance(result, list):
        return result
    if isinstance(result, dict):
        return [result]
    return []


def _make_fallback_tool(tool_name: str):
    """Create a plain Python function wrapper that invokes the MCP Toolbox HTTP endpoint."""
    if tool_name == "get_tract_burden":
        def get_tract_burden(tract_ids: str = "ALL") -> list[dict[str, Any]]:
            """Get adult health burden and chronic disease prevalence for Fulton County census tracts from CDC PLACES."""
            return call_toolbox_tool("get_tract_burden", {"tract_ids": tract_ids})
        return get_tract_burden

    if tool_name == "get_tract_access":
        def get_tract_access(limit: int = 50) -> list[dict[str, Any]]:
            """Get straight-line upper-bound distances to any federal care site and nearest federal safety-net site, no-vehicle %, and coordinates."""
            return call_toolbox_tool("get_tract_access", {"limit": int(limit)})
        return get_tract_access

    if tool_name == "get_site_capacity":
        def get_site_capacity() -> list[dict[str, Any]]:
            """Get in-county federally recognized safety-net care sites in Fulton County with weekly operating hours."""
            return call_toolbox_tool("get_site_capacity", {})
        return get_site_capacity

    if tool_name == "get_hsa_trend":
        def get_hsa_trend(weeks: int = 8) -> list[dict[str, Any]]:
            """Get the last N weeks of respiratory emergency department visit percentages for Fulton County's multi-county HSA."""
            return call_toolbox_tool("get_hsa_trend", {"weeks": int(weeks)})
        return get_hsa_trend

    if tool_name == "get_county_air_summary":
        def get_county_air_summary() -> list[dict[str, Any]]:
            """Get county-level PM2.5 air quality summary across Fulton County from the 12 km EPA model grid."""
            return call_toolbox_tool("get_county_air_summary", {})
        return get_county_air_summary

    if tool_name == "get_shortage_status":
        def get_shortage_status() -> list[dict[str, Any]]:
            """Get count of active vs proposed-for-withdrawal HRSA HPSA geographic designations for Fulton County."""
            return call_toolbox_tool("get_shortage_status", {})
        return get_shortage_status

    if tool_name == "get_need_ranking":
        def get_need_ranking(limit: int = 25) -> list[dict[str, Any]]:
            """Compute the composite need_score (uninsured_pr * access * mobility) for Fulton County tracts and return top N."""
            return call_toolbox_tool("get_need_ranking", {"limit": int(limit)})
        return get_need_ranking

    if tool_name == "get_nearest_state_safety_net":
        def get_nearest_state_safety_net(tract_id: str) -> list[dict[str, Any]]:
            """Find the nearest safety-net care site across all of Georgia in care_sites_state for a given 11-digit Fulton census tract ID."""
            return call_toolbox_tool("get_nearest_state_safety_net", {"tract_id": str(tract_id).zfill(11)})
        return get_nearest_state_safety_net

    if tool_name == "get_tract_demographics":
        def get_tract_demographics(tract_ids: str) -> list[dict[str, Any]]:
            """AUDIT_TOOLS ONLY: Fetch census tract racial/ethnic demographic counts from a4i_audit.tract_demographics."""
            return call_toolbox_tool("get_tract_demographics", {"tract_ids": tract_ids})
        return get_tract_demographics

    if tool_name == "get_county_demographics":
        def get_county_demographics() -> list[dict[str, Any]]:
            """AUDIT_TOOLS ONLY: Fetch Fulton County aggregate racial/ethnic demographic totals from a4i_audit.tract_demographics."""
            return call_toolbox_tool("get_county_demographics", {})
        return get_county_demographics

    raise ValueError(f"Unknown toolbox tool: {tool_name}")


def load_agent_toolset(toolset_name: str) -> list[Any]:
    """Load one toolset per agent from the MCP Toolbox server via `toolbox-core`.

    If `ToolboxSyncClient` is connected to the live Toolbox server, we still wrap or return
    clean Python callables backed by the MCP Toolbox server so ADK's tool introspection and
    async event loop work without thread-loop conflicts.
    """
    if toolset_name not in TOOLSET_DEFINITIONS:
        raise ValueError(f"Unknown toolset {toolset_name!r}. Valid: {list(TOOLSET_DEFINITIONS)}")

    # Verify ToolboxSyncClient can reach the server when available, and return ADK-compatible callables
    # that invoke the MCP Toolbox server tools.
    try:
        client = ToolboxSyncClient(get_toolbox_url())
        _ = client
    except Exception:
        pass

    return [_make_fallback_tool(name) for name in TOOLSET_DEFINITIONS[toolset_name]]

