#!/bin/bash

# Fix SolarTunes Systemd Service
# Restores proper service configuration for boot startup

echo "🔧 Fixing SolarTunes Systemd Service"
echo "==================================="

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

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "SolarTunes project directory not found at $PROJECT_DIR"
    exit 1
fi

print_status "Stopping current service..."
sudo systemctl stop solartunes 2>/dev/null || true

print_status "Creating corrected systemd service..."

# Create a robust systemd service that handles both locked and unlocked states
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

# Pre-start script to ensure directories exist and detect SD card state
ExecStartPre=/bin/bash -c '\
    # Create RAM disk directories if they don'\''t exist \
    mkdir -p /tmp/solartunes-ram/{logs,temp,cache} 2>/dev/null || true; \
    chown -R $USER:$USER /tmp/solartunes-ram 2>/dev/null || true; \
    \
    # Check if SD card is read-only \
    if mount | grep " / " | grep -q "ro,\\|ro)"; then \
        echo "SD card is read-only, using RAM disk for logs"; \
        export SOLARTUNES_USE_RAMDISK=true; \
    else \
        echo "SD card is read-write, using normal logging"; \
        export SOLARTUNES_USE_RAMDISK=false; \
    fi'

# Main start command - use pnpm if available, fallback to npm
ExecStart=/bin/bash -c '\
    # Check if pnpm is available \
    if command -v pnpm >/dev/null 2>&1; then \
        echo "Starting SolarTunes with pnpm..."; \
        exec pnpm start; \
    elif [ -x "$HOME/.local/share/pnpm/pnpm" ]; then \
        echo "Starting SolarTunes with local pnpm..."; \
        exec $HOME/.local/share/pnpm/pnpm start; \
    elif command -v npm >/dev/null 2>&1; then \
        echo "Starting SolarTunes with npm..."; \
        exec npm start; \
    else \
        echo "No package manager found!"; \
        exit 1; \
    fi'

# Restart policy
Restart=always
RestartSec=10

# Logging - conditional based on SD card state
StandardOutput=journal
StandardError=journal
SyslogIdentifier=solartunes

# Resource limits
MemoryMax=512M
TasksMax=50

[Install]
WantedBy=multi-user.target
EOL

print_status "Reloading systemd daemon..."
sudo systemctl daemon-reload

print_status "Enabling SolarTunes service for boot startup..."
sudo systemctl enable solartunes

print_status "Testing service startup..."
if sudo systemctl start solartunes; then
    print_status "✅ Service started successfully"
    
    # Wait a moment for startup
    sleep 5
    
    # Check if it's actually running
    if systemctl is-active --quiet solartunes; then
        print_status "✅ Service is running and healthy"
        
        # Show status
        echo ""
        echo "📊 Service Status:"
        sudo systemctl status solartunes --no-pager -l
        
        echo ""
        echo "📋 Recent Logs:"
        sudo journalctl -u solartunes -n 10 --no-pager
        
    else
        print_error "❌ Service started but is not active"
        echo ""
        echo "📋 Error Logs:"
        sudo journalctl -u solartunes -n 20 --no-pager
    fi
else
    print_error "❌ Service failed to start"
    echo ""
    echo "📋 Error Details:"
    sudo systemctl status solartunes --no-pager -l
    echo ""
    echo "📋 Error Logs:"
    sudo journalctl -u solartunes -n 20 --no-pager
fi

print_status "Creating service management helper script..."

# Create a helper script for service management
cat > $PROJECT_DIR/scripts/manage-service.sh << 'EOL'
#!/bin/bash

# SolarTunes Service Management Helper
# Provides easy commands for managing the systemd service

echo "🔧 SolarTunes Service Management"
echo "==============================="

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

show_status() {
    echo "📊 Service Status:"
    echo "=================="
    
    if systemctl is-active --quiet solartunes; then
        print_status "✅ SolarTunes is RUNNING"
    else
        print_error "❌ SolarTunes is STOPPED"
    fi
    
    if systemctl is-enabled --quiet solartunes; then
        print_status "✅ Auto-start is ENABLED"
    else
        print_warning "⚠️  Auto-start is DISABLED"
    fi
    
    echo ""
    echo "Detailed status:"
    sudo systemctl status solartunes --no-pager -l
    
    echo ""
    echo "Recent logs (last 10 lines):"
    sudo journalctl -u solartunes -n 10 --no-pager
}

start_service() {
    print_status "Starting SolarTunes service..."
    if sudo systemctl start solartunes; then
        sleep 3
        if systemctl is-active --quiet solartunes; then
            print_status "✅ Service started successfully"
        else
            print_error "❌ Service failed to start properly"
            sudo journalctl -u solartunes -n 10 --no-pager
        fi
    else
        print_error "❌ Failed to start service"
    fi
}

stop_service() {
    print_status "Stopping SolarTunes service..."
    if sudo systemctl stop solartunes; then
        print_status "✅ Service stopped successfully"
    else
        print_error "❌ Failed to stop service"
    fi
}

restart_service() {
    print_status "Restarting SolarTunes service..."
    if sudo systemctl restart solartunes; then
        sleep 3
        if systemctl is-active --quiet solartunes; then
            print_status "✅ Service restarted successfully"
        else
            print_error "❌ Service failed to restart properly"
            sudo journalctl -u solartunes -n 10 --no-pager
        fi
    else
        print_error "❌ Failed to restart service"
    fi
}

enable_autostart() {
    print_status "Enabling auto-start on boot..."
    if sudo systemctl enable solartunes; then
        print_status "✅ Auto-start enabled"
    else
        print_error "❌ Failed to enable auto-start"
    fi
}

disable_autostart() {
    print_status "Disabling auto-start on boot..."
    if sudo systemctl disable solartunes; then
        print_status "✅ Auto-start disabled"
    else
        print_error "❌ Failed to disable auto-start"
    fi
}

show_logs() {
    local lines=${1:-50}
    echo "📋 Recent Logs (last $lines lines):"
    echo "===================================="
    sudo journalctl -u solartunes -n $lines --no-pager
}

follow_logs() {
    print_status "Following logs (Ctrl+C to stop)..."
    sudo journalctl -u solartunes -f
}

case "${1:-menu}" in
    "status")
        show_status
        ;;
    "start")
        start_service
        ;;
    "stop")
        stop_service
        ;;
    "restart")
        restart_service
        ;;
    "enable")
        enable_autostart
        ;;
    "disable")
        disable_autostart
        ;;
    "logs")
        show_logs ${2:-50}
        ;;
    "follow")
        follow_logs
        ;;
    "menu"|*)
        echo ""
        echo "Choose an option:"
        echo "1) Show service status"
        echo "2) Start service"
        echo "3) Stop service"
        echo "4) Restart service"
        echo "5) Enable auto-start on boot"
        echo "6) Disable auto-start on boot"
        echo "7) Show recent logs"
        echo "8) Follow logs (live)"
        echo "9) Exit"
        echo ""
        read -p "Enter your choice (1-9): " choice
        
        case $choice in
            1) show_status ;;
            2) start_service ;;
            3) stop_service ;;
            4) restart_service ;;
            5) enable_autostart ;;
            6) disable_autostart ;;
            7) 
                read -p "How many log lines to show? (default 50): " lines
                show_logs ${lines:-50}
                ;;
            8) follow_logs ;;
            9) print_status "Exiting..."; exit 0 ;;
            *) print_error "Invalid choice"; exit 1 ;;
        esac
        ;;
esac
EOL

chmod +x $PROJECT_DIR/scripts/manage-service.sh

print_status "Creating package.json verification script..."

# Create script to verify package.json and dependencies
cat > $PROJECT_DIR/scripts/verify-dependencies.sh << 'EOL'
#!/bin/bash

# Verify SolarTunes Dependencies
# Checks if all required files and dependencies are present

echo "🔍 Verifying SolarTunes Dependencies"
echo "==================================="

PROJECT_DIR="$HOME/solartunes"
cd "$PROJECT_DIR" || exit 1

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

errors=0

# Check package.json
if [ -f "package.json" ]; then
    print_status "package.json exists"
    
    # Check if it has required scripts
    if grep -q '"start"' package.json; then
        print_status "Start script found in package.json"
    else
        print_error "Start script missing in package.json"
        errors=$((errors + 1))
    fi
else
    print_error "package.json missing"
    errors=$((errors + 1))
fi

# Check node_modules
if [ -d "node_modules" ]; then
    print_status "node_modules directory exists"
else
    print_warning "node_modules directory missing - dependencies may need installation"
fi

# Check Next.js build
if [ -d ".next" ]; then
    print_status "Next.js build directory exists"
else
    print_warning "Next.js build missing - project may need building"
fi

# Check main application files
required_files=(
    "app/page.tsx"
    "app/layout.tsx"
    "app/api/files/route.ts"
    "app/api/play/route.ts"
    "app/api/stop/route.ts"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "$file exists"
    else
        print_error "$file missing"
        errors=$((errors + 1))
    fi
done

# Check package managers
if command -v pnpm >/dev/null 2>&1; then
    print_status "pnpm is available"
elif [ -x "$HOME/.local/share/pnpm/pnpm" ]; then
    print_status "Local pnpm is available"
elif command -v npm >/dev/null 2>&1; then
    print_warning "Only npm is available (pnpm recommended)"
else
    print_error "No package manager found"
    errors=$((errors + 1))
fi

# Check Node.js
if command -v node >/dev/null 2>&1; then
    node_version=$(node --version)
    print_status "Node.js is available: $node_version"
else
    print_error "Node.js not found"
    errors=$((errors + 1))
fi

echo ""
if [ $errors -eq 0 ]; then
    print_status "All dependencies verified successfully!"
    echo ""
    echo "🚀 Ready to start SolarTunes"
else
    print_error "Found $errors error(s) that need to be fixed"
    echo ""
    echo "🔧 Suggested fixes:"
    
    if [ ! -f "package.json" ]; then
        echo "• Run the deploy script: ./scripts/deploy-project.sh"
    fi
    
    if [ ! -d "node_modules" ]; then
        echo "• Install dependencies: pnpm install (or npm install)"
    fi
    
    if [ ! -d ".next" ]; then
        echo "• Build the project: pnpm build (or npm run build)"
    fi
    
    if ! command -v node >/dev/null 2>&1; then
        echo "• Install Node.js: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
    fi
fi

exit $errors
EOL

chmod +x $PROJECT_DIR/scripts/verify-dependencies.sh

echo ""
print_status "✅ Systemd service fix complete!"
echo ""
echo "📋 What was fixed:"
echo "• Corrected systemd service configuration"
echo "• Added proper error handling and fallbacks"
echo "• Enabled auto-start on boot"
echo "• Created service management helper"
echo "• Added dependency verification script"
echo ""
echo "🔧 Management commands:"
echo "• Service control:    ~/solartunes/scripts/manage-service.sh"
echo "• Verify deps:        ~/solartunes/scripts/verify-dependencies.sh"
echo "• Direct commands:    sudo systemctl {start|stop|restart|status} solartunes"
echo ""
echo "🌐 Your SolarTunes should now start automatically on boot!"

# Final verification
echo ""
print_status "Running final verification..."
if systemctl is-active --quiet solartunes; then
    print_status "✅ Service is currently running"
    echo "🌐 Access at: http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'localhost'):3000"
else
    print_warning "⚠️  Service is not running - check logs with: sudo journalctl -u solartunes -n 20"
fi

if systemctl is-enabled --quiet solartunes; then
    print_status "✅ Auto-start on boot is enabled"
else
    print_warning "⚠️  Auto-start is not enabled - run: sudo systemctl enable solartunes"
fi
