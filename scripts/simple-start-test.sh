#!/bin/bash

# Simple Start Test
# Tests if SolarTunes can start manually without systemd

echo "🧪 Simple SolarTunes Start Test"
echo "==============================="

PROJECT_DIR="$HOME/solartunes"
cd "$PROJECT_DIR" || { echo "Cannot find project directory"; exit 1; }

echo "Current directory: $(pwd)"
echo "Testing manual start..."

# Kill any existing processes on port 3000
sudo pkill -f "node.*3000" 2>/dev/null || true
sleep 2

# Set environment variables
export NODE_ENV=production
export PORT=3000

echo ""
echo "Starting SolarTunes manually..."
echo "Press Ctrl+C to stop"
echo ""

# Try to start with available package manager
if command -v pnpm >/dev/null 2>&1; then
    echo "Using pnpm..."
    pnpm start
elif [ -x "$HOME/.local/share/pnpm/pnpm" ]; then
    echo "Using local pnpm..."
    $HOME/.local/share/pnpm/pnpm start
elif command -v npm >/dev/null 2>&1; then
    echo "Using npm..."
    npm start
else
    echo "No package manager found!"
    exit 1
fi
