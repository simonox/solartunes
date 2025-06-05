#!/bin/bash

# SolarTunes Start Script
# Starts the SolarTunes sound player service

echo "🌱 Starting SolarTunes Sound Player..."

# Check if systemd is available
if command -v systemctl &> /dev/null; then
    echo "Starting systemd service..."
    sudo systemctl start solartunes
    
    # Check if service started successfully
    if systemctl is-active --quiet solartunes; then
        echo "✅ SolarTunes service started successfully!"
        echo "🌐 Access your sound player at: http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'localhost'):3000"
    else
        echo "❌ Failed to start SolarTunes service"
        echo "📋 Check status with: sudo systemctl status solartunes"
        exit 1
    fi
else
    # Fallback for development/preview environments
    echo "systemctl not available - starting in development mode..."
    cd "$(dirname "$0")/.."
    
    if command -v pnpm &> /dev/null; then
        echo "Starting with pnpm..."
        pnpm start
    elif command -v npm &> /dev/null; then
        echo "Starting with npm..."
        npm start
    else
        echo "❌ No package manager found (pnpm or npm required)"
        exit 1
    fi
fi
