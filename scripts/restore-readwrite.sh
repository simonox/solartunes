#!/bin/bash

# Restore Read-Write Mode
# Undoes the changes made by reboot-to-readonly.sh

echo "🔄 Restoring Read-Write Mode"
echo "============================"

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

# Check if running as root for system changes
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root for permanent changes"
   echo "Run: sudo $0"
   echo ""
   echo "For temporary unlock only, run: sudo mount -o remount,rw /"
   exit 1
fi

print_status "Step 1: Making filesystem writable immediately..."
mount -o remount,rw /
if mount | grep ' / ' | grep -q 'rw'; then
    print_status "✅ Filesystem is now read-write"
else
    print_error "❌ Failed to make filesystem writable"
    exit 1
fi

print_status "Step 2: Disabling read-only boot service..."
if systemctl is-enabled readonly-boot.service >/dev/null 2>&1; then
    systemctl disable readonly-boot.service
    print_status "✅ Read-only boot service disabled"
else
    print_status "Read-only boot service was not enabled"
fi

print_status "Step 3: Removing read-only boot service..."
if [ -f "/etc/systemd/system/readonly-boot.service" ]; then
    rm /etc/systemd/system/readonly-boot.service
    print_status "✅ Read-only boot service removed"
else
    print_status "Read-only boot service file not found"
fi

print_status "Step 4: Restoring normal SolarTunes service..."
systemctl stop solartunes

# Restore normal SolarTunes service
cat > /etc/systemd/system/solartunes.service << 'EOL'
[Unit]
Description=SolarTunes Sound Player
After=network.target sound.target
Wants=network.target

[Service]
Type=exec
User=pi
Group=pi
WorkingDirectory=/home/pi/solartunes

# Environment variables
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/home/pi/.local/share/pnpm:/home/pi/.local/bin

# Main start command
ExecStart=/bin/bash -c '\
    cd /home/pi/solartunes && \
    if [ -x "/home/pi/.local/share/pnpm/pnpm" ]; then \
        echo "Starting with local pnpm..." && \
        exec /home/pi/.local/share/pnpm/pnpm start; \
    elif command -v pnpm >/dev/null 2>&1; then \
        echo "Starting with system pnpm..." && \
        exec pnpm start; \
    elif command -v npm >/dev/null 2>&1; then \
        echo "Starting with npm..." && \
        exec npm start; \
    else \
        echo "No package manager found!" && \
        exit 1; \
    fi'

# Restart configuration
Restart=always
RestartSec=10
StartLimitInterval=60
StartLimitBurst=3

# Process management
KillMode=mixed
KillSignal=SIGTERM
TimeoutStopSec=30

# Logging (back to normal journal)
StandardOutput=journal
StandardError=journal
SyslogIdentifier=solartunes

# Security and resource limits
NoNewPrivileges=true
MemoryMax=512M
TasksMax=100

[Install]
WantedBy=multi-user.target
EOL

print_status "Step 5: Re-enabling system services..."
systemctl enable rsyslog 2>/dev/null || true
systemctl enable systemd-journald 2>/dev/null || true

print_status "Step 6: Reloading systemd and restarting services..."
systemctl daemon-reload
systemctl start solartunes

# Wait for service to start
sleep 5

if systemctl is-active --quiet solartunes; then
    print_status "✅ SolarTunes is running normally"
else
    print_warning "⚠️  SolarTunes may need manual restart"
fi

print_status "Step 7: Starting system services..."
systemctl start rsyslog 2>/dev/null || true

echo ""
print_status "✅ System restored to normal read-write mode!"
echo ""
echo "📋 Summary of changes:"
echo "• Filesystem is now read-write"
echo "• Read-only boot service disabled and removed"
echo "• SolarTunes service restored to normal operation"
echo "• System logging services re-enabled"
echo ""
echo "🔄 The system will now boot normally (read-write) on future reboots"
echo "🌐 Access SolarTunes at: http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'localhost'):3000"
