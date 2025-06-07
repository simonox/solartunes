#!/bin/bash

# RAM Disk Setup for SolarTunes
# Creates RAM-based storage for logs and temporary files when SD card is locked

echo "💾 Setting up RAM Disk for SolarTunes"
echo "====================================="

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

print_status "Creating RAM disk directories..."

# Create RAM disk mount points
sudo mkdir -p /tmp/solartunes-ram
sudo mkdir -p /tmp/solartunes-ram/logs
sudo mkdir -p /tmp/solartunes-ram/temp
sudo mkdir -p /tmp/solartunes-ram/cache

# Set proper permissions
sudo chown -R $USER:$USER /tmp/solartunes-ram
chmod -R 755 /tmp/solartunes-ram

print_status "Creating systemd tmpfiles configuration..."

# Create tmpfiles.d configuration to recreate RAM disk structure on boot
sudo tee /etc/tmpfiles.d/solartunes.conf > /dev/null << EOL
# SolarTunes RAM disk structure
d /tmp/solartunes-ram 0755 $USER $USER -
d /tmp/solartunes-ram/logs 0755 $USER $USER -
d /tmp/solartunes-ram/temp 0755 $USER $USER -
d /tmp/solartunes-ram/cache 0755 $USER $USER -
EOL

print_status "Creating log rotation script for RAM disk..."

# Create script to manage RAM disk logs (prevent them from growing too large)
cat > $PROJECT_DIR/scripts/manage-ramdisk-logs.sh << 'EOL'
#!/bin/bash

# RAM Disk Log Management for SolarTunes
# Prevents RAM disk logs from consuming too much memory

MAX_LOG_SIZE_MB=10
LOG_DIR="/tmp/solartunes-ram/logs"

# Function to truncate large log files
truncate_large_logs() {
    find "$LOG_DIR" -name "*.log" -size +${MAX_LOG_SIZE_MB}M -exec truncate -s 0 {} \;
}

# Function to clean old temporary files
clean_temp_files() {
    find "/tmp/solartunes-ram/temp" -type f -mtime +1 -delete 2>/dev/null || true
    find "/tmp/solartunes-ram/cache" -type f -mtime +1 -delete 2>/dev/null || true
}

# Function to show RAM disk usage
show_usage() {
    echo "RAM Disk Usage:"
    du -sh /tmp/solartunes-ram/* 2>/dev/null || echo "No data in RAM disk"
    echo ""
    echo "Available RAM:"
    free -h | grep "^Mem:"
}

case "${1:-clean}" in
    "clean")
        truncate_large_logs
        clean_temp_files
        ;;
    "status")
        show_usage
        ;;
    *)
        echo "Usage: $0 {clean|status}"
        exit 1
        ;;
esac
EOL

chmod +x $PROJECT_DIR/scripts/manage-ramdisk-logs.sh

print_status "Creating systemd service for RAM disk log management..."

# Create systemd service to periodically clean RAM disk
sudo tee /etc/systemd/system/solartunes-ramdisk-cleanup.service > /dev/null << EOL
[Unit]
Description=SolarTunes RAM Disk Cleanup
After=multi-user.target

[Service]
Type=oneshot
User=$USER
ExecStart=$PROJECT_DIR/scripts/manage-ramdisk-logs.sh clean
EOL

# Create systemd timer to run cleanup every 30 minutes
sudo tee /etc/systemd/system/solartunes-ramdisk-cleanup.timer > /dev/null << EOL
[Unit]
Description=SolarTunes RAM Disk Cleanup Timer
Requires=solartunes-ramdisk-cleanup.service

[Timer]
OnCalendar=*:0/30
Persistent=true

[Install]
WantedBy=timers.target
EOL

# Enable the timer
sudo systemctl daemon-reload
sudo systemctl enable solartunes-ramdisk-cleanup.timer
sudo systemctl start solartunes-ramdisk-cleanup.timer

print_status "Updating SolarTunes systemd service to use RAM disk..."

# Update the SolarTunes service to use RAM disk for logs
sudo tee /etc/systemd/system/solartunes.service > /dev/null << EOL
[Unit]
Description=SolarTunes Sound Player
After=network.target sound.target
Wants=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=SOLARTUNES_LOG_DIR=/tmp/solartunes-ram/logs
Environment=SOLARTUNES_TEMP_DIR=/tmp/solartunes-ram/temp
Environment=SOLARTUNES_CACHE_DIR=/tmp/solartunes-ram/cache
ExecStartPre=/bin/bash -c 'mkdir -p /tmp/solartunes-ram/{logs,temp,cache} && chown -R $USER:$USER /tmp/solartunes-ram'
ExecStart=$HOME/.local/share/pnpm/pnpm start
Restart=always
RestartSec=10
StandardOutput=append:/tmp/solartunes-ram/logs/solartunes.log
StandardError=append:/tmp/solartunes-ram/logs/solartunes-error.log
SyslogIdentifier=solartunes

[Install]
WantedBy=multi-user.target
EOL

print_status "Creating SD card lock/unlock scripts with service management..."

# Update the SD card management script to handle service restart
cat > $PROJECT_DIR/scripts/manage-sdcard-with-service.sh << 'EOL'
#!/bin/bash

# SD Card Management with Service Handling for SolarTunes
# Manages SD card protection while keeping the service running

echo "🛡️ SD Card Management with Service Handling"
echo "==========================================="

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

# Function to check if SolarTunes is running
is_solartunes_running() {
    systemctl is-active --quiet solartunes
}

# Function to safely lock SD card
safe_lock_sdcard() {
    print_status "Safely locking SD card..."
    
    # Stop SolarTunes service temporarily
    if is_solartunes_running; then
        print_status "Stopping SolarTunes service..."
        sudo systemctl stop solartunes
        sleep 2
    fi
    
    # Ensure RAM disk is ready
    mkdir -p /tmp/solartunes-ram/{logs,temp,cache}
    chown -R $USER:$USER /tmp/solartunes-ram
    
    # Lock the SD card
    if ~/solartunes/scripts/manage-sdcard.sh lock; then
        print_status "✅ SD card locked successfully"
        
        # Restart SolarTunes service (it will now use RAM disk)
        print_status "Restarting SolarTunes service with RAM disk..."
        sudo systemctl start solartunes
        
        # Wait for service to start
        sleep 3
        
        if is_solartunes_running; then
            print_status "✅ SolarTunes is running with SD card locked"
            print_status "📝 Logs are now stored in RAM: /tmp/solartunes-ram/logs/"
        else
            print_error "❌ SolarTunes failed to start after locking SD card"
            return 1
        fi
    else
        print_error "❌ Failed to lock SD card"
        
        # Restart SolarTunes anyway
        print_status "Restarting SolarTunes service..."
        sudo systemctl start solartunes
        return 1
    fi
}

# Function to safely unlock SD card
safe_unlock_sdcard() {
    print_status "Safely unlocking SD card..."
    
    # Unlock the SD card
    if ~/solartunes/scripts/manage-sdcard.sh unlock; then
        print_status "✅ SD card unlocked successfully"
        
        # Restart SolarTunes service (it can now write to SD card again)
        print_status "Restarting SolarTunes service..."
        sudo systemctl restart solartunes
        
        # Wait for service to start
        sleep 3
        
        if is_solartunes_running; then
            print_status "✅ SolarTunes is running with SD card unlocked"
            print_status "📝 Logs are now stored normally"
        else
            print_error "❌ SolarTunes failed to start after unlocking SD card"
            return 1
        fi
    else
        print_error "❌ Failed to unlock SD card"
        return 1
    fi
}

# Function to show status
show_status() {
    echo "📊 System Status:"
    echo "================"
    
    # SD card status
    if mount | grep ' / ' | grep -q 'ro,\|ro)'; then
        print_status "🔒 SD Card: LOCKED (read-only)"
    else
        print_warning "🔓 SD Card: UNLOCKED (read-write)"
    fi
    
    # Service status
    if is_solartunes_running; then
        print_status "🎵 SolarTunes: RUNNING"
    else
        print_error "🎵 SolarTunes: STOPPED"
    fi
    
    # RAM disk usage
    echo ""
    echo "💾 RAM Disk Usage:"
    du -sh /tmp/solartunes-ram/* 2>/dev/null || echo "No data in RAM disk"
    
    # Recent logs
    echo ""
    echo "📝 Recent Logs (last 5 lines):"
    tail -5 /tmp/solartunes-ram/logs/solartunes.log 2>/dev/null || echo "No logs in RAM disk"
}

# Main menu
case "${1:-menu}" in
    "lock")
        safe_lock_sdcard
        ;;
    "unlock")
        safe_unlock_sdcard
        ;;
    "status")
        show_status
        ;;
    "menu"|*)
        echo ""
        echo "Choose an option:"
        echo "1) Show system status"
        echo "2) Safely lock SD card (with service restart)"
        echo "3) Safely unlock SD card (with service restart)"
        echo "4) Exit"
        echo ""
        read -p "Enter your choice (1-4): " choice
        
        case $choice in
            1) show_status ;;
            2) safe_lock_sdcard ;;
            3) safe_unlock_sdcard ;;
            4) print_status "Exiting..."; exit 0 ;;
            *) print_error "Invalid choice"; exit 1 ;;
        esac
        ;;
esac
EOL

chmod +x $PROJECT_DIR/scripts/manage-sdcard-with-service.sh

print_status "✅ RAM Disk setup complete!"
echo ""
echo "📋 What was configured:"
echo "• RAM disk directories created at /tmp/solartunes-ram/"
echo "• Systemd tmpfiles configuration for boot persistence"
echo "• Log rotation and cleanup for RAM disk"
echo "• Updated SolarTunes service to use RAM disk when SD card is locked"
echo "• Safe SD card management script that handles service restarts"
echo ""
echo "🔧 New management commands:"
echo "• Safe lock:     ~/solartunes/scripts/manage-sdcard-with-service.sh lock"
echo "• Safe unlock:   ~/solartunes/scripts/manage-sdcard-with-service.sh unlock"
echo "• Show status:   ~/solartunes/scripts/manage-sdcard-with-service.sh status"
echo "• Clean RAM:     ~/solartunes/scripts/manage-ramdisk-logs.sh clean"
echo ""
echo "🌐 The web interface will continue working even when SD card is locked!"
echo ""
print_warning "⚠️  Important Notes:"
echo "• RAM disk data is lost on reboot"
echo "• RAM disk is limited by available system memory"
echo "• Logs are automatically cleaned to prevent memory exhaustion"
echo "• Use the safe lock/unlock commands to maintain service availability"
