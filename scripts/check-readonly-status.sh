#!/bin/bash

# Check Read-Only Status
# Shows current filesystem status and read-only configuration

echo "📊 Read-Only Status Check"
echo "========================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}$1${NC}"
}

print_header "🔍 Current Filesystem Status"
echo "============================="

# Check current mount status
if mount | grep ' / ' | grep -q 'ro,\|ro)'; then
    print_error "Filesystem is currently READ-ONLY"
    echo "To make writable: sudo mount -o remount,rw /"
else
    print_status "Filesystem is currently READ-WRITE"
fi

echo ""
echo "Mount details:"
mount | grep ' / ' | head -1

print_header "🔧 Read-Only Boot Configuration"
echo "==============================="

# Check if read-only boot service exists
if [ -f "/etc/systemd/system/readonly-boot.service" ]; then
    print_warning "Read-only boot service EXISTS"
    
    if systemctl is-enabled readonly-boot.service >/dev/null 2>&1; then
        print_warning "Read-only boot service is ENABLED"
        echo "System will boot read-only on next reboot"
    else
        print_status "Read-only boot service is disabled"
    fi
else
    print_status "No read-only boot service found"
    echo "System will boot normally (read-write)"
fi

print_header "🎵 SolarTunes Service Status"
echo "============================"

if systemctl is-active --quiet solartunes; then
    print_status "SolarTunes is RUNNING"
else
    print_error "SolarTunes is STOPPED"
fi

# Check if SolarTunes is configured for RAM disk
if grep -q "SOLARTUNES_LOG_DIR=/tmp/solartunes-ram" /etc/systemd/system/solartunes.service 2>/dev/null; then
    print_warning "SolarTunes is configured for RAM disk operation"
else
    print_status "SolarTunes is configured for normal operation"
fi

print_header "💾 RAM Disk Status"
echo "=================="

if [ -d "/tmp/solartunes-ram" ]; then
    ram_usage=$(du -sh /tmp/solartunes-ram 2>/dev/null | cut -f1)
    print_status "RAM disk exists, usage: $ram_usage"
else
    print_status "No RAM disk found"
fi

print_header "🔄 Quick Actions"
echo "================"

echo ""
echo "Available commands:"
echo "• Make writable now:     sudo mount -o remount,rw /"
echo "• Make read-only now:    sudo mount -o remount,ro /"
echo "• Restore normal mode:   sudo ./scripts/restore-readwrite.sh"
echo "• Force read-only boot:  sudo ./scripts/reboot-to-readonly.sh"
echo ""

# Show current status summary
if mount | grep ' / ' | grep -q 'ro,\|ro)'; then
    if [ -f "/etc/systemd/system/readonly-boot.service" ]; then
        echo "📋 Status: Read-only NOW and on FUTURE boots"
    else
        echo "📋 Status: Read-only NOW but will boot normally next time"
    fi
else
    if [ -f "/etc/systemd/system/readonly-boot.service" ]; then
        echo "📋 Status: Read-write NOW but will boot read-only next time"
    else
        echo "📋 Status: Read-write NOW and on FUTURE boots"
    fi
fi
