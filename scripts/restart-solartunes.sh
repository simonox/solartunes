#!/bin/bash

# SolarTunes Restart Script
# Restarts the SolarTunes sound player service

echo "🔄 Restarting SolarTunes Sound Player..."

# Check if systemd is available
if command -v systemctl &> /dev/null; then
    echo "Restarting systemd service..."
    sudo systemctl restart solartunes
    
    # Wait a moment for service to start
    sleep 3
    
    # Check if service restarted successfully
    if systemctl is-active --quiet solartunes; then
        echo "✅ SolarTunes service restarted successfully!"
        echo "🌐 Access your sound player at: http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'localhost'):3000"
        
        # Show recent logs
        echo ""
        echo "📋 Recent logs:"
        sudo journalctl -u solartunes -n 10 --no-pager
    else
        echo "❌ Failed to restart SolarTunes service"
        echo "📋 Check status with: sudo systemctl status solartunes"
        echo "📋 Check logs with: sudo journalctl -u solartunes -n 20"
        exit 1
    fi
else
    # Fallback for development/preview environments
    echo "systemctl not available - restarting manually..."
    
    # Stop first
    ./stop-solartunes.sh
    
    # Wait a moment
    sleep 2
    
    # Start again
    ./start-solartunes.sh
fi
