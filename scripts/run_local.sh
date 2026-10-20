#!/usr/bin/env bash
# Start MCP Toolbox daemon and ADK Web UI locally
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Clinic Van Planner Local Runner ==="
echo "Repo root: $REPO_ROOT"

cd "$REPO_ROOT"

# Ensure venv exists
if [ ! -d ".venv" ]; then
  echo "Creating .venv..."
  python3 -m venv .venv
  .venv/bin/pip install --upgrade pip
  .venv/bin/pip install -r requirements.txt
fi

# Ensure toolbox binary exists
if [ ! -f "toolbox" ]; then
  echo "Downloading MCP Toolbox..."
  curl -fsSL https://storage.googleapis.com/genai-toolbox/v0.32.0/linux/amd64/toolbox -o toolbox
  chmod +x toolbox
fi

# Check if toolbox is already running
if ! curl -sf http://127.0.0.1:5000/ready >/dev/null 2>&1; then
  echo "Starting MCP Toolbox on port 5000..."
  ./toolbox --tools-file agent/toolbox/tools.yaml --enable-api > /tmp/toolbox.log 2>&1 &
  sleep 2
fi

echo "Toolbox is ready on http://127.0.0.1:5000"

# Launch ADK Web
echo "Starting ADK Web interface on port 8080..."
exec .venv/bin/adk web --host 0.0.0.0 --port 8080 agent

