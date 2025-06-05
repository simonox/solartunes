#!/bin/bash

# SolarTunes Status Script
# Shows the status of the SolarTunes sound player service

echo "📊 SolarTunes Sound Player Status"
echo "================================="

# Check if systemd is available
if command -v systemctl &> /dev/null; then
    echo ""
    echo "🔧 Service Status:"
    sudo systemctl status solartunes --no-pager
    
    echo ""
    echo "📋 Recent Logs (last 20 lines):"
    sudo journalctl -u solartunes -n 20 --no-pager
    
    echo ""
    echo "🌐 Network Status:"
    if command -v netstat &> /dev/null; then
        netstat -tlnp 2>/dev/null | grep :3000 || echo "Port 3000 not in use"
    else
        ss -tlnp 2>/dev/null | grep :3000 || echo "Port 3000 not in use"
    fi
    
else
    # Fallback for development/preview environments
    echo ""
    echo "systemctl not available - checking processes manually..."
    
    echo ""
    echo "🔧 Process Status:"
    PIDS=$(pgrep -f "node.*solartunes\|next.*start" 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        echo "✅ SolarTunes processes running: $PIDS"
        ps aux | grep -E "node.*solartunes|next.*start" | grep -v grep
    else
        echo "❌ No SolarTunes processes found"
    fi
    
    echo ""
    echo "🌐 Port Status:"
    if command -v lsof &> /dev/null; then
        lsof -i :3000 2>/dev/null || echo "Port 3000 not in use"
    else
        echo "lsof not available - cannot check port status"
    fi
fi

echo ""
echo "🎵 Audio Status:"
if command -v aplay &> /dev/null; then
    echo "Audio devices:"
    aplay -l 2>/dev/null || echo "No audio devices found"
    
    echo ""
    echo "Active audio processes:"
    pgrep -f aplay &>/dev/null && echo "✅ Audio playback active" || echo "🔇 No audio playback"
else
    echo "aplay not available - cannot check audio status"
fi

echo ""
echo "💾 System Resources:"
if command -v free &> /dev/null; then
    echo "Memory usage:"
    free -h
else
    echo "free command not available"
fi

if command -v df &> /dev/null; then
    echo ""
    echo "Disk usage:"
    df -h . 2>/dev/null || echo "Cannot check disk usage"
fi

echo ""
echo "🌡️  System Temperature:"
if command -v vcgencmd &> /dev/null; then
    vcgencmd measure_temp 2>/dev/null || echo "Temperature monitoring not available"
else
    echo "vcgencmd not available (not on Raspberry Pi)"
fi

echo ""
echo "⚡ Power Status:"
if [ -f "/sys/class/power_supply/BAT0/capacity" ]; then
    echo "Battery: $(cat /sys/class/power_supply/BAT0/capacity)%"
elif command -v vcgencmd &> /dev/null; then
    THROTTLED=$(vcgencmd get_throttled 2>/dev/null || echo "throttled=0x0")
    echo "Throttling status: $THROTTLED"
else
    echo "Power monitoring not available"
fi

echo ""
echo "🌐 Access URLs:"
if command -v hostname &> /dev/null; then
    LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "unknown")
    echo "Local: http://localhost:3000"
    echo "Network: http://$LOCAL_IP:3000"
else
    echo "http://localhost:3000"
fi
