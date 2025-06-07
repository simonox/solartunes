#!/bin/bash

# Emergency SD Card Lock Script
# Uses extreme measures to force SD card into read-only mode

echo "🚨 EMERGENCY SD CARD LOCK"
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

# Function to identify processes keeping filesystem busy
identify_busy_processes() {
    print_header "🔍 Identifying Busy Processes"
    echo "================================="
    
    echo "Processes using root filesystem:"
    lsof / 2>/dev/null | grep -v "COMMAND\|systemd\|kernel" | head -20 || echo "No specific processes found"
    
    echo ""
    echo "Processes writing to files:"
    lsof -w 2>/dev/null | head -20 || echo "No writing processes found"
    
    echo ""
    echo "Active services that might affect filesystem:"
    systemctl list-units --state=running --type=service | grep -E 'journal|log|write|data|storage|fs|mount' || echo "No suspicious services found"
}

# Function to perform extreme cleanup
extreme_cleanup() {
    print_header "🧹 Performing Extreme Cleanup"
    echo "=============================="
    
    print_status "Stopping all non-essential services..."
    sudo systemctl stop solartunes motion-detector bluetooth avahi-daemon cups cron rsyslog || true
    
    print_status "Killing all user processes..."
    # Kill all processes owned by the current user except the script itself
    pkill -u $USER -f -9 "node|npm|pnpm|python|aplay|bash" || true
    
    print_status "Stopping logging services..."
    sudo systemctl stop rsyslog systemd-journald || true
    
    print_status "Syncing filesystem multiple times..."
    for i in {1..5}; do
        sync
        sleep 1
    done
    
    print_status "Dropping caches..."
    echo 3 | sudo tee /proc/sys/vm/drop_caches > /dev/null
    
    print_status "Cleanup complete"
}

# Function for emergency lock
emergency_lock() {
    print_header "🔒 EMERGENCY LOCK PROCEDURE"
    echo "============================"
    
    print_status "First checking current mount status..."
    mount | grep ' / ' | head -1
    
    # Check if already read-only
    if mount | grep ' / ' | grep -q 'ro,\|ro)'; then
        print_status "Filesystem is already read-only!"
        return 0
    fi
    
    # Identify what might be keeping it busy
    identify_busy_processes
    
    # Ask for confirmation
    echo ""
    print_warning "⚠️  WARNING: This will aggressively kill processes and may disrupt system operation"
    read -p "Continue with emergency lock? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        print_status "Operation cancelled"
        return 1
    fi
    
    # Perform cleanup
    extreme_cleanup
    
    print_status "Attempting emergency remount..."
    if sudo mount -o remount,ro / 2>/dev/null; then
        print_status "✅ SUCCESS! Filesystem is now read-only"
        return 0
    else
        print_error "❌ Standard remount failed, trying alternative methods..."
    fi
    
    # Try more aggressive approach
    print_status "Trying direct block device remount..."
    ROOT_DEVICE=$(findmnt -n -o SOURCE /)
    if sudo mount -o remount,ro $ROOT_DEVICE / 2>/dev/null; then
        print_status "✅ SUCCESS! Filesystem is now read-only"
        return 0
    else
        print_error "❌ Direct device remount failed"
    fi
    
    # Last resort - try with lazy unmount option
    print_status "Attempting lazy remount as last resort..."
    if sudo mount -o remount,ro,lazy / 2>/dev/null; then
        print_status "✅ SUCCESS with lazy option! Filesystem is now read-only"
        return 0
    else
        print_error "❌ All remount attempts failed"
        
        print_warning "The system may need to be rebooted to achieve read-only state"
        print_warning "You can try: sudo shutdown -r now"
        return 1
    fi
}

# Function to check status
check_status() {
    print_header "📊 SD Card Status"
    echo "================="
    
    if mount | grep ' / ' | grep -q 'ro,\|ro)'; then
        print_status "✅ Filesystem is READ-ONLY"
    else
        print_warning "⚠️  Filesystem is READ-WRITE"
    fi
    
    echo ""
    echo "Mount details:"
    mount | grep ' / ' | head -1
    
    echo ""
    echo "Filesystem usage:"
    df -h / | tail -1
}

# Function to unlock (much simpler)
emergency_unlock() {
    print_header "🔓 Emergency Unlock"
    echo "==================="
    
    if sudo mount -o remount,rw / 2>/dev/null; then
        print_status "✅ Filesystem unlocked successfully"
        return 0
    else
        print_error "❌ Failed to unlock filesystem"
        return 1
    fi
}

# Main menu
case "${1:-menu}" in
    "status")
        check_status
        ;;
    "lock")
        emergency_lock
        ;;
    "unlock")
        emergency_unlock
        ;;
    "diagnose")
        identify_busy_processes
        ;;
    "menu"|*)
        echo ""
        echo "Choose an option:"
        echo "1) Check SD card status"
        echo "2) EMERGENCY LOCK (aggressive)"
        echo "3) Unlock SD card"
        echo "4) Diagnose busy processes"
        echo "5) Exit"
        echo ""
        read -p "Enter your choice (1-5): " choice
        
        case $choice in
            1) check_status ;;
            2) emergency_lock ;;
            3) emergency_unlock ;;
            4) identify_busy_processes ;;
            5) print_status "Exiting..."; exit 0 ;;
            *) print_error "Invalid choice"; exit 1 ;;
        esac
        ;;
esac
