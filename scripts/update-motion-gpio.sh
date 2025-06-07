#!/bin/bash

echo "🔧 Updating Motion Detector to use GPIO5"
echo "========================================"

PROJECT_DIR="$HOME/solartunes"
cd "$PROJECT_DIR" || { echo "Error: solartunes directory not found"; exit 1; }

# Stop motion detector service if running
if command -v systemctl &> /dev/null; then
    sudo systemctl stop motion-detector 2>/dev/null || echo "Service not running"
fi

# Update the motion detector script to use GPIO5
if [ -f "scripts/motion-detector.py" ]; then
    echo "📝 Updating motion-detector.py to use GPIO5..."
    sed -i 's/MOTION_PIN = 17/MOTION_PIN = 5/g' scripts/motion-detector.py
    echo "✅ Updated GPIO pin to 5"
else
    echo "❌ motion-detector.py not found. Please run setup-motion-sensor.sh first."
    exit 1
fi

# Update any test scripts that might reference GPIO17
if [ -f "scripts/test-motion-sensor.sh" ]; then
    sed -i 's/GPIO.*17/GPIO 5/g' scripts/test-motion-sensor.sh
fi

# Restart the motion detector service
if command -v systemctl &> /dev/null; then
    echo "🔄 Restarting motion detector service..."
    sudo systemctl start motion-detector
    
    if systemctl is-active --quiet motion-detector; then
        echo "✅ Motion detector restarted successfully with GPIO5"
    else
        echo "❌ Failed to restart motion detector"
        echo "Check status with: sudo systemctl status motion-detector"
    fi
else
    echo "ℹ️  Please manually restart the motion detector"
fi

echo ""
echo "🔌 Updated Wiring Instructions:"
echo "=============================="
echo ""
echo "PIR Sensor Pin  →  Raspberry Pi Pin"
echo "─────────────────────────────────────"
echo "VCC (Power)     →  Pin 2 (5V) or Pin 1 (3.3V)"
echo "OUT (Signal)    →  Pin 29 (GPIO5)  ← UPDATED"
echo "GND (Ground)    →  Pin 6 (Ground)"
echo ""
echo "📍 Pin 29 Location:"
echo "Pin 27 (GPIO0)    Pin 28 (GPIO1)"
echo "Pin 29 (GPIO5) ←  Pin 30 (Ground)  ← Connect OUT to Pin 29"
echo "Pin 31 (GPIO6)    Pin 32 (GPIO12)"
echo ""
echo "✅ Motion detector now configured for GPIO5 (Pin 29)"
echo "🧪 Test with: ./scripts/test-motion-sensor.sh"
