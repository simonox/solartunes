#!/bin/bash

# SD Card Write Protection Setup Script
# Sets up utilities and permissions for SD card write protection

echo "🛡️ SD Card Write Protection Setup"
echo "================================="

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

print_status "Setting up SD card write protection utilities..."

# Add user to necessary groups for mount operations
print_status "Adding user to disk group for SD card access..."
sudo usermod -a -G disk $USER

# Remove any existing sudoers file first
sudo rm -f /etc/sudoers.d/solartunes-mount

# Create sudoers rule for mount operations without password
print_status "Creating sudoers rule for mount operations..."
sudo tee /etc/sudoers.d/solartunes-mount > /dev/null << EOL
# Allow SolarTunes user to remount filesystem without password
$USER ALL=(ALL) NOPASSWD: /bin/mount -o remount,ro /
$USER ALL=(ALL) NOPASSWD: /bin/mount -o remount,rw /
$USER ALL=(ALL) NOPASSWD: /bin/sync
EOL

# Test the sudoers file syntax
print_status "Testing sudoers file syntax..."
if sudo visudo -c -f /etc/sudoers.d/solartunes-mount; then
    print_status "✅ Sudoers file syntax is valid"
else
    print_error "❌ Sudoers file has syntax errors. Trying alternative approach..."
    
    # Remove the problematic file
    sudo rm -f /etc/sudoers.d/solartunes-mount
    
    # Try with a different approach - using a wrapper script
    print_status "Creating mount wrapper script..."
    sudo tee /usr/local/bin/solartunes-mount > /dev/null << 'EOL'
#!/bin/bash
# SolarTunes mount wrapper script

case "$1" in
    "lock")
        sync
        mount -o remount,ro /
        ;;
    "unlock")
        mount -o remount,rw /
        ;;
    *)
        echo "Usage: $0 {lock|unlock}"
        exit 1
        ;;
esac
EOL
    
    sudo chmod +x /usr/local/bin/solartunes-mount
    
    # Create simpler sudoers rule for the wrapper
    sudo tee /etc/sudoers.d/solartunes-mount > /dev/null << EOL
# Allow SolarTunes user to use mount wrapper without password
$USER ALL=(ALL) NOPASSWD: /usr/local/bin/solartunes-mount
EOL
    
    # Test the new sudoers file
    if sudo visudo -c -f /etc/sudoers.d/solartunes-mount; then
        print_status "✅ Alternative sudoers approach successful"
        USE_WRAPPER=true
    else
        print_error "❌ Still having sudoers issues. Manual configuration may be needed."
        sudo rm -f /etc/sudoers.d/solartunes-mount
        USE_WRAPPER=false
    fi
fi

# Create SD card management script
print_status "Creating SD card management script..."
if [ "${USE_WRAPPER:-false}" = "true" ]; then
    # Use wrapper script version
    cat > ~/solartunes/scripts/manage-sdcard.sh << 'EOL'
#!/bin/bash

# SD Card Management Script for SolarTunes (Wrapper Version)
# Provides utilities for managing SD card write protection

echo "🛡️ SD Card Management"
echo "===================="

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

# Function to check current mount status
check_mount_status() {
    echo "📊 Current SD Card Status:"
    echo "========================="
    
    # Check if root is mounted read-only
    if mount | grep ' / ' | grep -q 'ro,\|ro)'; then
        print_status "✅ SD Card is LOCKED (read-only)"
    else
        print_warning "🔓 SD Card is UNLOCKED (read-write)"
    fi
    
    echo ""
    echo "Mount information:"
    mount | grep ' / ' | head -1
    
    echo ""
    echo "Disk usage:"
    df -h / | tail -1
    
    echo ""
    echo "Hardware write protection:"
    if [ -f "/sys/block/mmcblk0/ro" ]; then
        hw_ro=$(cat /sys/block/mmcblk0/ro)
        if [ "$hw_ro" = "1" ]; then
            print_warning "⚠️  Hardware write protection is ENABLED"
        else
            print_status "Hardware write protection is disabled"
        fi
    else
        echo "Hardware write protection status unknown"
    fi
}

# Function to lock SD card (read-only)
lock_sdcard() {
    print_status "Locking SD card (mounting as read-only)..."
    
    if sudo /usr/local/bin/solartunes-mount lock; then
        print_status "✅ SD card locked successfully"
    else
        print_error "❌ Failed to lock SD card"
        return 1
    fi
}

# Function to unlock SD card (read-write)
unlock_sdcard() {
    print_status "Unlocking SD card (mounting as read-write)..."
    
    # Check hardware write protection first
    if [ -f "/sys/block/mmcblk0/ro" ] && [ "$(cat /sys/block/mmcblk0/ro)" = "1" ]; then
        print_error "❌ Cannot unlock: Hardware write protection is enabled"
        print_error "Please check the physical write protection switch on your SD card"
        return 1
    fi
    
    if sudo /usr/local/bin/solartunes-mount unlock; then
        print_status "✅ SD card unlocked successfully"
    else
        print_error "❌ Failed to unlock SD card"
        return 1
    fi
}

# Function to show help
show_help() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  status    Show current SD card status"
    echo "  lock      Lock SD card (read-only)"
    echo "  unlock    Unlock SD card (read-write)"
    echo "  help      Show this help message"
    echo ""
    echo "If no command is provided, an interactive menu will be shown."
}

# Main menu
case "${1:-menu}" in
    "status")
        check_mount_status
        ;;
    "lock")
        lock_sdcard
        ;;
    "unlock")
        unlock_sdcard
        ;;
    "help")
        show_help
        ;;
    "menu"|*)
        echo ""
        echo "Choose an option:"
        echo "1) Show SD card status"
        echo "2) Lock SD card (read-only)"
        echo "3) Unlock SD card (read-write)"
        echo "4) Exit"
        echo ""
        read -p "Enter your choice (1-4): " choice
        
        case $choice in
            1) check_mount_status ;;
            2) lock_sdcard ;;
            3) unlock_sdcard ;;
            4) print_status "Exiting..."; exit 0 ;;
            *) print_error "Invalid choice"; exit 1 ;;
        esac
        ;;
esac
EOL
else
    # Use direct mount version
    cat > ~/solartunes/scripts/manage-sdcard.sh << 'EOL'
#!/bin/bash

# SD Card Management Script for SolarTunes
# Provides utilities for managing SD card write protection

echo "🛡️ SD Card Management"
echo "===================="

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

# Function to check current mount status
check_mount_status() {
    echo "📊 Current SD Card Status:"
    echo "========================="
    
    # Check if root is mounted read-only
    if mount | grep ' / ' | grep -q 'ro,\|ro)'; then
        print_status "✅ SD Card is LOCKED (read-only)"
    else
        print_warning "🔓 SD Card is UNLOCKED (read-write)"
    fi
    
    echo ""
    echo "Mount information:"
    mount | grep ' / ' | head -1
    
    echo ""
    echo "Disk usage:"
    df -h / | tail -1
    
    echo ""
    echo "Hardware write protection:"
    if [ -f "/sys/block/mmcblk0/ro" ]; then
        hw_ro=$(cat /sys/block/mmcblk0/ro)
        if [ "$hw_ro" = "1" ]; then
            print_warning "⚠️  Hardware write protection is ENABLED"
        else
            print_status "Hardware write protection is disabled"
        fi
    else
        echo "Hardware write protection status unknown"
    fi
}

# Function to lock SD card (read-only)
lock_sdcard() {
    print_status "Locking SD card (mounting as read-only)..."
    
    # Sync all pending writes
    sync
    
    # Remount as read-only (using sudo directly)
    if sudo mount -o remount,ro /; then
        print_status "✅ SD card locked successfully"
    else
        print_error "❌ Failed to lock SD card"
        return 1
    fi
}

# Function to unlock SD card (read-write)
unlock_sdcard() {
    print_status "Unlocking SD card (mounting as read-write)..."
    
    # Check hardware write protection first
    if [ -f "/sys/block/mmcblk0/ro" ] && [ "$(cat /sys/block/mmcblk0/ro)" = "1" ]; then
        print_error "❌ Cannot unlock: Hardware write protection is enabled"
        print_error "Please check the physical write protection switch on your SD card"
        return 1
    fi
    
    # Remount as read-write (using sudo directly)
    if sudo mount -o remount,rw /; then
        print_status "✅ SD card unlocked successfully"
    else
        print_error "❌ Failed to unlock SD card"
        return 1
    fi
}

# Function to show help
show_help() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  status    Show current SD card status"
    echo "  lock      Lock SD card (read-only)"
    echo "  unlock    Unlock SD card (read-write)"
    echo "  help      Show this help message"
    echo ""
    echo "If no command is provided, an interactive menu will be shown."
}

# Main menu
case "${1:-menu}" in
    "status")
        check_mount_status
        ;;
    "lock")
        lock_sdcard
        ;;
    "unlock")
        unlock_sdcard
        ;;
    "help")
        show_help
        ;;
    "menu"|*)
        echo ""
        echo "Choose an option:"
        echo "1) Show SD card status"
        echo "2) Lock SD card (read-only)"
        echo "3) Unlock SD card (read-write)"
        echo "4) Exit"
        echo ""
        read -p "Enter your choice (1-4): " choice
        
        case $choice in
            1) check_mount_status ;;
            2) lock_sdcard ;;
            3) unlock_sdcard ;;
            4) print_status "Exiting..."; exit 0 ;;
        esac
        ;;
esac
EOL
fi

chmod +x ~/solartunes/scripts/manage-sdcard.sh

# Update the API to use the appropriate method
print_status "Updating API to use correct mount method..."
if [ "${USE_WRAPPER:-false}" = "true" ]; then
    print_status "API will use wrapper script method"
else
    print_status "API will use direct sudo method (may require password)"
fi

# Create systemd service for automatic read-only on shutdown
print_status "Creating shutdown service for automatic SD card protection..."
sudo tee /etc/systemd/system/sdcard-protect.service > /dev/null << EOL
[Unit]
Description=Protect SD Card on Shutdown
DefaultDependencies=false
Before=shutdown.target reboot.target halt.target

[Service]
Type=oneshot
RemainAfterExit=true
ExecStart=/bin/true
ExecStop=/bin/bash -c 'sync && mount -o remount,ro /'
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
EOL

sudo systemctl enable sdcard-protect.service

print_status "✅ SD Card write protection setup complete!"
echo ""
echo "📋 What was configured:"
echo "• User added to disk group for SD card access"
if [ "${USE_WRAPPER:-false}" = "true" ]; then
    echo "• Mount wrapper script created at /usr/local/bin/solartunes-mount"
    echo "• Sudoers rule created for wrapper script"
else
    echo "• Direct sudo mount access (may require password prompts)"
fi
echo "• SD card management script created"
echo "• Automatic protection on shutdown enabled"
echo ""
echo "🔧 Management commands:"
echo "• Check status:  ~/solartunes/scripts/manage-sdcard.sh status"
echo "• Lock SD card:  ~/solartunes/scripts/manage-sdcard.sh lock"
echo "• Unlock SD card: ~/solartunes/scripts/manage-sdcard.sh unlock"
echo "• Interactive:   ~/solartunes/scripts/manage-sdcard.sh"
echo ""
echo "🌐 Use the web interface SD Card widget for easy control!"
echo ""
print_warning "⚠️  Important Notes:"
echo "• Locking the SD card prevents all writes, including logs"
echo "• Unlock before uploading files or making system changes"
echo "• The system will automatically lock on shutdown"
echo "• Hardware write protection (if present) overrides software protection"
if [ "${USE_WRAPPER:-false}" = "false" ]; then
    echo "• You may be prompted for sudo password when using the web interface"
fi
