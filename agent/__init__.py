"""Agent package root for Challenge 5 Clinic Van Planner."""

import os

# Auto-configure Vertex AI if no Gemini Developer API key is provided
if not os.environ.get("GEMINI_API_KEY"):
    os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "true")
    os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "qwiklabs-gcp-04-26e02fd45203")
    os.environ.setdefault("GOOGLE_CLOUD_LOCATION", "us-central1")

from .clinic_broker.agent import root_agent

__all__ = ["root_agent"]

