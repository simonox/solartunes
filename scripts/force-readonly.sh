#!/bin/bash

# Force Read-Only Script
# Uses the most aggressive approach to force read-only mode

echo "⚡ FORCE READ-ONLY MODE"
echo "======================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Check if already read-only
if mount | grep ' / ' | grep -q 'ro,\|ro)'; then
    print_status "Filesystem is already read-only!"
    exit 0
fi

print_warning "⚠️  This will aggressively stop services and processes"
read -p "Continue? (y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Cancelled"
    exit 0
fi

print_status "Step 1: Stopping all user services..."
sudo systemctl stop solartunes motion-detector 2>/dev/null || true

print_status "Step 2: Stopping system logging..."
sudo systemctl stop rsyslog systemd-journald 2>/dev/null || true

print_status "Step 3: Stopping other services..."
sudo systemctl stop cron bluetooth avahi-daemon cups 2>/dev/null || true

print_status "Step 4: Killing user processes..."
sudo pkill -u $USER -f "node|npm|pnpm|python|aplay" 2>/dev/null || true

print_status "Step 5: Syncing filesystem..."
sync
sync
sync
sleep 3

print_status "Step 6: Dropping caches..."
echo 3 | sudo tee /proc/sys/vm/drop_caches > /dev/null 2>&1 || true

print_status "Step 7: Attempting remount..."
if sudo mount -o remount,ro /; then
    print_status "✅ SUCCESS! Filesystem is now read-only"
    
    # Restart SolarTunes
    print_status "Restarting SolarTunes with RAM disk..."
    mkdir -p /tmp/solartunes-ram/{logs,temp,cache}
    chown -R $USER:$USER /tmp/solartunes-ram
    sudo systemctl start solartunes
    
    print_status "🎉 SD card is now protected!"
else
    print_error "❌ FAILED - filesystem is still busy"
    print_error "You may need to reboot: sudo reboot"
fi
