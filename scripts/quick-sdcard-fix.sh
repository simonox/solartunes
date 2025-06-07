#!/bin/bash

# Quick SD Card Fix Script
# Simple approach to identify and fix common SD card locking issues

echo "🔧 Quick SD Card Fix"
echo "==================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Function to check current status
check_status() {
    if mount | grep ' / ' | grep -q 'ro,\|ro)'; then
        print_status "SD card is already READ-ONLY"
        return 0
    else
        print_warning "SD card is READ-write"
        return 1
    fi
}

# Function to try simple fixes
try_simple_fixes() {
    echo "Trying simple fixes..."
    
    # Stop common services that might interfere
    print_status "Stopping potentially interfering services..."
    sudo systemctl stop rsyslog 2>/dev/null || true
    sudo systemctl stop cron 2>/dev/null || true
    
    # Sync filesystem
    print_status "Syncing filesystem..."
    sync
    sleep 2
    
    # Try basic remount
    print_status "Attempting basic remount..."
    if sudo mount -o remount,ro / 2>/dev/null; then
        print_status "✅ SUCCESS! SD card is now read-only"
        return 0
    else
        print_error "Basic remount failed"
        return 1
    fi
}

# Function to show what's keeping filesystem busy
show_busy_processes() {
    echo ""
    echo "Processes that might be keeping filesystem busy:"
    echo "================================================"
    
    # Show top processes using root filesystem
    lsof / 2>/dev/null | grep -v "COMMAND\|systemd\|kernel" | head -10 || echo "No specific processes found"
    
    echo ""
    echo "Services that commonly cause issues:"
    echo "===================================="
    
    # Check specific services
    if systemctl is-active --quiet rsyslog; then
        print_warning "rsyslog is running (logs to disk)"
    fi
    
    if systemctl is-active --quiet systemd-journald; then
        print_warning "systemd-journald is running (logs to disk)"
    fi
    
    if systemctl is-active --quiet cron; then
        print_warning "cron is running (may write to disk)"
    fi
    
    if systemctl is-active --quiet solartunes; then
        print_warning "solartunes is running (may write logs)"
    fi
}

# Main execution
echo "Checking current SD card status..."
if check_status; then
    echo "No action needed!"
    exit 0
fi

echo ""
echo "Attempting to lock SD card..."

if try_simple_fixes; then
    echo ""
    print_status "🎉 SD card successfully locked!"
    
    # Restart essential services
    print_status "Restarting SolarTunes..."
    sudo systemctl start solartunes
    
    echo ""
    echo "✅ SD card is now protected and SolarTunes is running"
else
    echo ""
    print_error "Simple fixes failed. Here's what might be causing the issue:"
    show_busy_processes
    
    echo ""
    echo "🔧 Next steps to try:"
    echo "1. Stop SolarTunes: sudo systemctl stop solartunes"
    echo "2. Stop journald: sudo systemctl stop systemd-journald"
    echo "3. Try emergency script: ./scripts/emergency-sdcard-lock.sh"
    echo "4. As last resort: sudo reboot"
fi
