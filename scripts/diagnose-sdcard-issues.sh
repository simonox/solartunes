#!/bin/bash

# SD Card Diagnostic Script
# Provides detailed diagnostics about SD card and filesystem issues

echo "🔍 SD Card Diagnostic Tool"
echo "========================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

print_header "📊 Basic SD Card Information"
echo "============================"

# Get filesystem information
echo "Root filesystem details:"
findmnt -n -o SOURCE,FSTYPE,OPTIONS / || echo "Could not determine filesystem"

echo ""
echo "Mount status:"
mount | grep ' / ' | head -1

echo ""
echo "Disk usage:"
df -h / | tail -1

print_header "🔍 Filesystem Activity"
echo "======================"

# Check for open files on root filesystem
echo "Open files on root filesystem (top 10):"
lsof / 2>/dev/null | grep -v "COMMAND\|systemd\|kernel" | head -10 || echo "No specific open files found"

echo ""
echo "Processes writing to files (top 10):"
lsof -w 2>/dev/null | head -10 || echo "No writing processes found"

print_header "🔧 System Services"
echo "=================="

# Check for services that might affect filesystem
echo "Running services that might affect filesystem:"
systemctl list-units --state=running --type=service | grep -E 'journal|log|write|data|storage|fs|mount' || echo "No suspicious services found"

print_header "📝 Journal and Logging"
echo "======================"

# Check journal status
echo "Journal status:"
sudo journalctl --disk-usage || echo "Could not determine journal usage"

echo ""
echo "Journal configuration:"
grep -r Storage /etc/systemd/journald.conf* || echo "No custom journal configuration found"

print_header "💾 Hardware Information"
echo "======================"

# Get SD card hardware info
echo "SD card device information:"
if [ -b "/dev/mmcblk0" ]; then
    lsblk -o NAME,SIZE,TYPE,MOUNTPOINT /dev/mmcblk0 || echo "Could not get SD card details"
    
    echo ""
    echo "SD card hardware write protection status:"
    if [ -f "/sys/block/mmcblk0/ro" ]; then
        ro_status=$(cat /sys/block/mmcblk0/ro)
        if [ "$ro_status" = "1" ]; then
            print_warning "Hardware write protection is ENABLED"
        else
            print_status "Hardware write protection is DISABLED"
        fi
    else
        echo "Could not determine hardware write protection status"
    fi
else
    echo "SD card device not found at /dev/mmcblk0"
fi

print_header "🔄 Recent System Activity"
echo "========================="

# Check for recent writes
echo "Recent filesystem activity (last 5 minutes):"
find / -type f -mmin -5 2>/dev/null | grep -v "/proc\|/sys\|/dev\|/run" | head -20 || echo "No recent file activity found"

print_header "📋 Recommendations"
echo "==================="

# Check if filesystem is read-only
if mount | grep ' / ' | grep -q 'ro,\|ro)'; then
    print_status "Filesystem is currently READ-ONLY"
    echo ""
    echo "If you want to make it read-write:"
    echo "• Run: sudo mount -o remount,rw /"
    echo "• Or use: ./scripts/emergency-sdcard-lock.sh unlock"
else
    print_warning "Filesystem is currently READ-WRITE"
    echo ""
    echo "To make it read-only, try these approaches in order:"
    echo "1. Standard method: sudo mount -o remount,ro /"
    echo "2. Emergency script: ./scripts/emergency-sdcard-lock.sh lock"
    echo "3. If all else fails, reboot with: sudo shutdown -r now"
    echo ""
    echo "Common reasons for lock failure:"
    echo "• Active logging services (journald, rsyslog)"
    echo "• Running applications writing to disk"
    echo "• Database or cache processes"
    echo "• Swap files in use"
    
    # Check for specific issues
    if lsof / 2>/dev/null | grep -q "systemd-journal"; then
        print_warning "systemd-journald is actively using the filesystem"
        echo "Try: sudo systemctl stop systemd-journald"
    fi
    
    if lsof / 2>/dev/null | grep -q "rsyslog"; then
        print_warning "rsyslog is actively using the filesystem"
        echo "Try: sudo systemctl stop rsyslog"
    fi
    
    if grep -q "/var/swap" /proc/swaps 2>/dev/null; then
        print_warning "Swap file is in use"
        echo "Try: sudo swapoff -a"
    fi
}

echo ""
print_status "Diagnostic complete!"
