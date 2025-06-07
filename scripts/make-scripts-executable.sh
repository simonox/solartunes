#!/bin/bash

echo "🔧 Making SolarTunes scripts executable..."

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Make all shell scripts executable
find "$SCRIPT_DIR" -name "*.sh" -exec chmod +x {} \;

# Make Python scripts executable
find "$SCRIPT_DIR" -name "*.py" -exec chmod +x {} \;

echo "✅ All scripts are now executable!"

# List all scripts
echo ""
echo "📋 Available scripts:"
ls -la "$SCRIPT_DIR"/*.sh "$SCRIPT_DIR"/*.py 2>/dev/null | grep -E '\.(sh|py)$'
