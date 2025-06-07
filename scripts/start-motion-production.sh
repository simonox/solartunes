#!/bin/bash

echo "🚀 Starting SolarTunes with Motion Detection"
echo "==========================================="

# Start SolarTunes first
echo "Starting SolarTunes..."
sudo systemctl start solartunes

# Wait for it to be ready
sleep 3

if systemctl is-active --quiet solartunes; then
    echo "✅ SolarTunes is running"
else
    echo "❌ SolarTunes failed to start"
    exit 1
fi

# Start motion detector
echo "Starting motion detector..."
sudo systemctl start motion-detector

sleep 2

if systemctl is-active --quiet motion-detector; then
    echo "✅ Motion detector is running"
else
    echo "❌ Motion detector failed to start"
    echo "Check logs: sudo journalctl -u motion-detector -n 20"
    exit 1
fi

echo ""
echo "🎉 Both services are running!"
echo ""
echo "📊 Status:"
echo "SolarTunes: $(systemctl is-active solartunes)"
echo "Motion Detector: $(systemctl is-active motion-detector)"
echo ""
echo "🌐 Access: http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'localhost'):3000"
echo ""
echo "📋 Next steps:"
echo "1. Open the web interface"
echo "2. Enable motion detection in the UI"
echo "3. Select a sound file for motion triggering"
echo "4. Test by waving your hand in front of the PIR sensor"
