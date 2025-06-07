#!/bin/bash

# Improved SD Card Write Protection Setup Script
# Creates a more robust system that handles busy processes better

echo "🛡️ Improved SD Card Write Protection Setup"
echo "=========================================="

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user."
   exit 1
fi

PROJECT_DIR="$HOME/solartunes"

print_status "Creating improved mount wrapper script..."

# Remove old wrapper if it exists
sudo rm -f /usr/local/bin/solartunes-mount

# Create improved mount wrapper script
sudo tee /usr/local/bin/solartunes-mount > /dev/null << 'EOL'
#!/bin/bash
# Improved SolarTunes mount wrapper script

# Function to force stop all non-essential processes
force_stop_processes() {
    echo "Force stopping processes that might keep filesystem busy..."
    
    # Stop specific services that might interfere
    systemctl --user stop pulseaudio 2>/dev/null || true
    sudo systemctl stop bluetooth 2>/dev/null || true
    sudo systemctl stop cups 2>/dev/null || true
    
    # Kill processes that commonly keep filesystem busy
    sudo pkill -f "dbus\|avahi\|systemd-logind" 2>/dev/null || true
    
    # Force sync and wait
    sync
    sleep 2
    
    # Drop caches to free up any filesystem references
    echo 3 | sudo tee /proc/sys/vm/drop_caches > /dev/null 2>&1 || true
    
    sleep 1
}

# Function to remount with multiple attempts
remount_with_retries() {
    local mode="$1"
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "Attempt $attempt of $max_attempts to remount as $mode..."
        
        # Sync before each attempt
        sync
        
        if [ "$mode" = "ro" ]; then
            if mount -o remount,ro / 2>/dev/null; then
                echo "Successfully remounted as read-only"
                return 0
            fi
        else
            if mount -o remount,rw / 2>/dev/null; then
                echo "Successfully remounted as read-write"
                return 0
            fi
        fi
        
        if [ $attempt -lt $max_attempts ]; then
            echo "Attempt $attempt failed, trying to free up filesystem..."
            force_stop_processes
            sleep 3
        fi
        
        attempt=$((attempt + 1))
    done
    
    echo "All attempts failed"
    return 1
}

case "$1" in
    "lock")
        echo "Attempting to lock filesystem (read-only)..."
        
        # First attempt without force
        sync
        if mount -o remount,ro / 2>/dev/null; then
            echo "Successfully remounted as read-only"
            exit 0
        fi
        
        echo "Initial attempt failed, using force method..."
        
        # Force method
        if remount_with_retries "ro"; then
            exit 0
        else
            echo "Failed to remount as read-only after all attempts"
            exit 1
        fi
        ;;
    "unlock")
        echo "Attempting to unlock filesystem (read-write)..."
        
        # Check hardware write protection first
        if [ -f "/sys/block/mmcblk0/ro" ] && [ "$(cat /sys/block/mmcblk0/ro)" = "1" ]; then
            echo "Error: Hardware write protection is enabled"
            exit 1
        fi
        
        if remount_with_retries "rw"; then
            # Restart essential services after unlock
            sudo systemctl start bluetooth 2>/dev/null || true
            sudo systemctl start cups 2>/dev/null || true
            systemctl --user start pulseaudio 2>/dev/null || true
            exit 0
        else
            echo "Failed to remount as read-write"
            exit 1
        fi
        ;;
    "status")
        # Check if root is mounted read-only
        if mount | grep ' / ' | grep -q 'ro,\|ro)'; then
            echo "read-only"
        else
            echo "read-write"
        fi
        exit 0
        ;;
    *)
        echo "Usage: $0 {lock|unlock|status}"
        exit 1
        ;;
esac
EOL

sudo chmod +x /usr/local/bin/solartunes-mount

print_status "Creating emergency SD card management script..."

# Create emergency script that uses different approach
cat > $PROJECT_DIR/scripts/emergency-sdcard-lock.sh << 'EOL'
#!/bin/bash

# Emergency SD Card Lock Script
# Uses a more aggressive approach when normal methods fail

echo "🚨 Emergency SD Card Lock"
echo "========================"

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

emergency_lock() {
    print_warning "Using emergency lock procedure..."
    
    # Stop all non-essential services
    print_status "Stopping non-essential services..."
    sudo systemctl stop solartunes 2>/dev/null || true
    sudo systemctl stop motion-detector 2>/dev/null || true
    sudo systemctl stop bluetooth 2>/dev/null || true
    sudo systemctl stop cups 2>/dev/null || true
    sudo systemctl stop avahi-daemon 2>/dev/null || true
    
    # Kill user processes that might be keeping filesystem busy
    print_status "Terminating user processes..."
    sudo pkill -u $USER -f "node\|python\|aplay" 2>/dev/null || true
    
    # Wait for processes to terminate
    sleep 3
    
    # Force sync multiple times
    print_status "Force syncing filesystem..."
    for i in {1..3}; do
        sync
        sleep 1
    done
    
    # Drop all caches
    print_status "Dropping filesystem caches..."
    echo 3 | sudo tee /proc/sys/vm/drop_caches > /dev/null 2>&1 || true
    
    # Try to remount with lazy unmount option
    print_status "Attempting emergency remount..."
    if sudo mount -o remount,ro / 2>/dev/null; then
        print_status "✅ Emergency lock successful!"
        
        # Restart essential services
        print_status "Restarting essential services..."
        sudo systemctl start solartunes
        
        return 0
    else
        print_error "❌ Emergency lock failed"
        print_error "The system may need a reboot to clear filesystem locks"
        return 1
    fi
}

emergency_unlock() {
    print_status "Emergency unlock..."
    
    # Check hardware write protection
    if [ -f "/sys/block/mmcblk0/ro" ] && [ "$(cat /sys/block/mmcblk0/ro)" = "1" ]; then
        print_error "Hardware write protection is enabled - cannot unlock"
        return 1
    fi
    
    if sudo mount -o remount,rw / 2>/dev/null; then
        print_status "✅ Emergency unlock successful!"
        
        # Restart all services
        sudo systemctl start solartunes
        sudo systemctl start motion-detector 2>/dev/null || true
        sudo systemctl start bluetooth 2>/dev/null || true
        sudo systemctl start cups 2>/dev/null || true
        sudo systemctl start avahi-daemon 2>/dev/null || true
        
        return 0
    else
        print_error "❌ Emergency unlock failed"
        return 1
    fi
}

show_status() {
    echo "📊 Emergency Status Check"
    echo "========================"
    
    # Mount status
    if mount | grep ' / ' | grep -q 'ro,\|ro)'; then
        print_status "🔒 SD Card: LOCKED (read-only)"
    else
        print_warning "🔓 SD Card: UNLOCKED (read-write)"
    fi
    
    # Service status
    echo ""
    echo "Service Status:"
    systemctl is-active solartunes && echo "✅ SolarTunes: Running" || echo "❌ SolarTunes: Stopped"
    systemctl is-active motion-detector && echo "✅ Motion: Running" || echo "❌ Motion: Stopped"
    
    # Process status
    echo ""
    echo "Busy processes on root filesystem:"
    lsof / 2>/dev/null | head -10 || echo "No processes found"
    
    # Memory status
    echo ""
    echo "Memory usage:"
    free -h | grep "^Mem:"
}

case "${1:-menu}" in
    "lock")
        emergency_lock
        ;;
    "unlock")
        emergency_unlock
        ;;
    "status")
        show_status
        ;;
    "menu"|*)
        echo ""
        echo "⚠️  Emergency SD Card Management"
        echo "This script uses aggressive methods and may disrupt services"
        echo ""
        echo "Choose an option:"
        echo "1) Show status"
        echo "2) Emergency lock"
        echo "3) Emergency unlock"
        echo "4) Exit"
        echo ""
        read -p "Enter your choice (1-4): " choice
        
        case $choice in
            1) show_status ;;
            2) emergency_lock ;;
            3) emergency_unlock ;;
            4) print_status "Exiting..."; exit 0 ;;
            *) print_error "Invalid choice"; exit 1 ;;
        esac
        ;;
esac
EOL

chmod +x $PROJECT_DIR/scripts/emergency-sdcard-lock.sh

print_status "Creating safer SD card management script..."

# Create a safer version that checks for busy processes first
cat > $PROJECT_DIR/scripts/safe-sdcard-manager.sh << 'EOL'
#!/bin/bash

# Safe SD Card Management Script
# Checks for busy processes and provides options before proceeding

echo "🛡️ Safe SD Card Management"
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

# Function to check for busy processes
check_busy_processes() {
    echo "🔍 Checking for processes that might prevent locking..."
    
    # Get processes using root filesystem
    local busy_processes=$(lsof / 2>/dev/null | grep -v "COMMAND\|systemd\|kernel" | head -20)
    
    if [ -n "$busy_processes" ]; then
        echo ""
        print_warning "Found processes using root filesystem:"
        echo "$busy_processes" | head -10
        echo ""
        
        local process_count=$(echo "$busy_processes" | wc -l)
        if [ $process_count -gt 10 ]; then
            echo "... and $((process_count - 10)) more processes"
        fi
        
        return 1
    else
        print_status "No problematic processes found"
        return 0
    fi
}

# Function to safely prepare for lock
prepare_for_lock() {
    print_status "Preparing system for SD card lock..."
    
    # Ensure RAM disk is ready
    mkdir -p /tmp/solartunes-ram/{logs,temp,cache}
    chown -R $USER:$USER /tmp/solartunes-ram
    
    # Stop SolarTunes service
    print_status "Stopping SolarTunes service..."
    sudo systemctl stop solartunes 2>/dev/null || true
    
    # Stop motion detector
    sudo systemctl stop motion-detector 2>/dev/null || true
    
    # Wait for services to stop
    sleep 3
    
    # Sync filesystem
    print_status "Syncing filesystem..."
    sync
    
    # Check if we can proceed
    if check_busy_processes; then
        return 0
    else
        echo ""
        print_warning "System may not be ready for safe locking"
        read -p "Do you want to proceed anyway? (y/N): " proceed
        if [[ $proceed =~ ^[Yy]$ ]]; then
            return 0
        else
            return 1
        fi
    fi
}

# Function to safely lock
safe_lock() {
    print_header "🔒 Safe SD Card Lock"
    
    if ! prepare_for_lock; then
        print_error "Lock preparation failed or cancelled"
        return 1
    fi
    
    print_status "Attempting to lock SD card..."
    
    if sudo /usr/local/bin/solartunes-mount lock; then
        print_status "✅ SD card locked successfully"
        
        # Start services with RAM disk
        print_status "Starting services with RAM disk..."
        sudo systemctl start solartunes
        
        # Wait and check
        sleep 3
        if systemctl is-active --quiet solartunes; then
            print_status "✅ SolarTunes is running with locked SD card"
        else
            print_warning "⚠️  SolarTunes may have failed to start"
        fi
        
        return 0
    else
        print_error "❌ Failed to lock SD card"
        
        # Restart services anyway
        print_status "Restarting services..."
        sudo systemctl start solartunes
        sudo systemctl start motion-detector 2>/dev/null || true
        
        return 1
    fi
}

# Function to safely unlock
safe_unlock() {
    print_header "🔓 Safe SD Card Unlock"
    
    print_status "Attempting to unlock SD card..."
    
    if sudo /usr/local/bin/solartunes-mount unlock; then
        print_status "✅ SD card unlocked successfully"
        
        # Restart services normally
        print_status "Restarting services..."
        sudo systemctl restart solartunes
        sudo systemctl start motion-detector 2>/dev/null || true
        
        # Wait and check
        sleep 3
        if systemctl is-active --quiet solartunes; then
            print_status "✅ SolarTunes is running with unlocked SD card"
        else
            print_warning "⚠️  SolarTunes may have failed to start"
        fi
        
        return 0
    else
        print_error "❌ Failed to unlock SD card"
        return 1
    fi
}

# Function to show comprehensive status
show_comprehensive_status() {
    print_header "📊 Comprehensive System Status"
    
    # SD card status
    if mount | grep ' / ' | grep -q 'ro,\|ro)'; then
        print_status "🔒 SD Card: LOCKED (read-only)"
    else
        print_warning "🔓 SD Card: UNLOCKED (read-write)"
    fi
    
    # Service status
    echo ""
    echo "🔧 Service Status:"
    if systemctl is-active --quiet solartunes; then
        print_status "✅ SolarTunes: Running"
    else
        print_error "❌ SolarTunes: Stopped"
    fi
    
    if systemctl is-active --quiet motion-detector; then
        print_status "✅ Motion Detector: Running"
    else
        print_warning "⚠️  Motion Detector: Stopped"
    fi
    
    # RAM disk status
    echo ""
    echo "💾 RAM Disk Status:"
    if [ -d "/tmp/solartunes-ram" ]; then
        local ram_usage=$(du -sh /tmp/solartunes-ram 2>/dev/null | cut -f1)
        print_status "RAM disk usage: $ram_usage"
    else
        print_warning "RAM disk not found"
    fi
    
    # Memory status
    echo ""
    echo "🧠 Memory Status:"
    free -h | grep "^Mem:"
    
    # Busy processes check
    echo ""
    check_busy_processes || true
}

# Main menu
case "${1:-menu}" in
    "lock")
        safe_lock
        ;;
    "unlock")
        safe_unlock
        ;;
    "status")
        show_comprehensive_status
        ;;
    "check")
        check_busy_processes
        ;;
    "menu"|*)
        echo ""
        echo "Choose an option:"
        echo "1) Show comprehensive status"
        echo "2) Check for busy processes"
        echo "3) Safe lock SD card"
        echo "4) Safe unlock SD card"
        echo "5) Emergency management (use emergency-sdcard-lock.sh)"
        echo "6) Exit"
        echo ""
        read -p "Enter your choice (1-6): " choice
        
        case $choice in
            1) show_comprehensive_status ;;
            2) check_busy_processes ;;
            3) safe_lock ;;
            4) safe_unlock ;;
            5) 
                print_status "Launching emergency management..."
                exec $HOME/solartunes/scripts/emergency-sdcard-lock.sh
                ;;
            6) print_status "Exiting..."; exit 0 ;;
            *) print_error "Invalid choice"; exit 1 ;;
        esac
        ;;
esac
EOL

chmod +x $PROJECT_DIR/scripts/safe-sdcard-manager.sh

# Update sudoers to include new wrapper
print_status "Updating sudoers configuration..."
sudo rm -f /etc/sudoers.d/solartunes-mount

sudo tee /etc/sudoers.d/solartunes-mount > /dev/null << EOL
# Allow SolarTunes user to use improved mount wrapper without password
$USER ALL=(ALL) NOPASSWD: /usr/local/bin/solartunes-mount
$USER ALL=(ALL) NOPASSWD: /bin/mount -o remount,ro /
$USER ALL=(ALL) NOPASSWD: /bin/mount -o remount,rw /
$USER ALL=(ALL) NOPASSWD: /bin/systemctl stop solartunes
$USER ALL=(ALL) NOPASSWD: /bin/systemctl start solartunes
$USER ALL=(ALL) NOPASSWD: /bin/systemctl restart solartunes
$USER ALL=(ALL) NOPASSWD: /bin/systemctl stop motion-detector
$USER ALL=(ALL) NOPASSWD: /bin/systemctl start motion-detector
$USER ALL=(ALL) NOPASSWD: /bin/systemctl stop bluetooth
$USER ALL=(ALL) NOPASSWD: /bin/systemctl start bluetooth
$USER ALL=(ALL) NOPASSWD: /bin/systemctl stop cups
$USER ALL=(ALL) NOPASSWD: /bin/systemctl start cups
$USER ALL=(ALL) NOPASSWD: /bin/systemctl stop avahi-daemon
$USER ALL=(ALL) NOPASSWD: /bin/systemctl start avahi-daemon
$USER ALL=(ALL) NOPASSWD: /bin/pkill -u $USER -f *
$USER ALL=(ALL) NOPASSWD: /bin/tee /proc/sys/vm/drop_caches
EOL

# Test the sudoers file syntax
if ! sudo visudo -c -f /etc/sudoers.d/solartunes-mount; then
    print_error "❌ Sudoers file has syntax errors. Removing it for safety."
    sudo rm -f /etc/sudoers.d/solartunes-mount
fi

print_status "✅ Improved SD card protection setup complete!"
echo ""
echo "📋 New management tools:"
echo "• Safe manager:      ~/solartunes/scripts/safe-sdcard-manager.sh"
echo "• Emergency manager: ~/solartunes/scripts/emergency-sdcard-lock.sh"
echo "• Check processes:   ~/solartunes/scripts/safe-sdcard-manager.sh check"
echo ""
echo "🔧 Recommended usage:"
echo "1. Always use the safe manager first"
echo "2. Check for busy processes before locking"
echo "3. Use emergency manager only if safe manager fails"
echo ""
print_warning "⚠️  The emergency manager will stop services aggressively!"
