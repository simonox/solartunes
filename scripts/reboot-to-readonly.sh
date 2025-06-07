#!/bin/bash

# Reboot to Read-Only Mode
# Configures the system to boot into read-only mode

echo "🔄 Reboot to Read-Only Mode"
echo "========================="

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
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   echo "Please run: sudo $0"
   exit 1
fi

print_status "Setting up boot-time read-only mount..."

# Create a systemd service that will run early in boot to mount read-only
cat > /etc/systemd/system/readonly-boot.service << 'EOL'
[Unit]
Description=Mount Root Filesystem as Read-Only
DefaultDependencies=no
After=systemd-remount-fs.service
Before=local-fs.target
Conflicts=shutdown.target
RequiresMountsFor=/

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/bin/mount -o remount,ro /
TimeoutSec=30

[Install]
WantedBy=local-fs.target
EOL

print_status "Enabling read-only boot service..."
systemctl enable readonly-boot.service

print_status "Creating RAM disk directories for logs..."
mkdir -p /tmp/solartunes-ram/{logs,temp,cache}
chown -R pi:pi /tmp/solartunes-ram

print_status "Updating SolarTunes service to use RAM disk..."
# Update the SolarTunes service to use RAM disk for logs
cat > /etc/systemd/system/solartunes.service << 'EOL'
[Unit]
Description=SolarTunes Sound Player
After=network.target sound.target readonly-boot.service
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
Environment=SOLARTUNES_LOG_DIR=/tmp/solartunes-ram/logs
Environment=SOLARTUNES_TEMP_DIR=/tmp/solartunes-ram/temp
Environment=SOLARTUNES_CACHE_DIR=/tmp/solartunes-ram/cache

# Pre-start setup
ExecStartPre=/bin/bash -c 'mkdir -p /tmp/solartunes-ram/{logs,temp,cache} && chown -R pi:pi /tmp/solartunes-ram'

# Main start command - find and use the correct package manager
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

# Logging to RAM disk
StandardOutput=append:/tmp/solartunes-ram/logs/solartunes.log
StandardError=append:/tmp/solartunes-ram/logs/solartunes-error.log
SyslogIdentifier=solartunes

# Security and resource limits
NoNewPrivileges=true
MemoryMax=512M
TasksMax=100

[Install]
WantedBy=multi-user.target
EOL

print_status "Reloading systemd daemon..."
systemctl daemon-reload

print_status "Disabling services that write to disk..."
systemctl disable rsyslog || true
systemctl disable systemd-journald || true

print_warning "⚠️  The system will now reboot and come up in read-only mode"
print_warning "⚠️  To return to read-write mode after boot, run:"
print_warning "⚠️  sudo mount -o remount,rw /"

read -p "Proceed with reboot now? (y/N): " confirm
if [[ "$confirm" =~ ^[Yy]$ ]]; then
    print_status "Rebooting now..."
    sync
    reboot
else
    print_status "Reboot cancelled. System is configured for read-only on next boot."
    print_status "Reboot manually when ready with: sudo reboot"
fi
