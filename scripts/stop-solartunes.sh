#!/bin/bash

# SolarTunes Stop Script
# Stops the SolarTunes sound player service

echo "🛑 Stopping SolarTunes Sound Player..."

# Check if systemd is available
if command -v systemctl &> /dev/null; then
    echo "Stopping systemd service..."
    sudo systemctl stop solartunes
    
    # Check if service stopped successfully
    if ! systemctl is-active --quiet solartunes; then
        echo "✅ SolarTunes service stopped successfully!"
    else
        echo "❌ Failed to stop SolarTunes service"
        echo "📋 Check status with: sudo systemctl status solartunes"
        exit 1
    fi
else
    # Fallback for development/preview environments
    echo "systemctl not available - stopping any running Node.js processes..."
    
    # Find and kill Node.js processes running SolarTunes
    PIDS=$(pgrep -f "node.*solartunes\|next.*start" 2>/dev/null || true)
    
    if [ -n "$PIDS" ]; then
        echo "Found SolarTunes processes: $PIDS"
        echo "Stopping processes..."
        kill $PIDS
        sleep 2
        
        # Force kill if still running
        REMAINING=$(pgrep -f "node.*solartunes\|next.*start" 2>/dev/null || true)
        if [ -n "$REMAINING" ]; then
            echo "Force stopping remaining processes..."
            kill -9 $REMAINING
        fi
        
        echo "✅ SolarTunes processes stopped!"
    else
        echo "ℹ️  No SolarTunes processes found running"
    fi
fi

# Also stop any aplay processes
if command -v pkill &> /dev/null; then
    pkill -f aplay 2>/dev/null || true
    echo "🔇 Stopped any audio playback"
fi
