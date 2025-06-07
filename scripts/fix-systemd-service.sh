#!/bin/bash

# Fix SolarTunes Systemd Service
# Fixes the service to properly run as a daemon

echo "🔧 Fixing SolarTunes Systemd Service for Proper Daemon Operation"
echo "=============================================================="

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

PROJECT_DIR="$HOME/solartunes"

print_status "Stopping current service..."
sudo systemctl stop solartunes 2>/dev/null || true

print_status "Creating fixed systemd service configuration..."

# Create a proper systemd service that runs as a daemon
sudo tee /etc/systemd/system/solartunes.service > /dev/null << EOL
[Unit]
Description=SolarTunes Sound Player
After=network.target sound.target
Wants=network.target

[Service]
Type=exec
User=$USER
Group=$USER
WorkingDirectory=$PROJECT_DIR

# Environment variables
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$HOME/.local/share/pnpm:$HOME/.local/bin

# Pre-start setup
ExecStartPre=/bin/bash -c 'mkdir -p /tmp/solartunes-ram/{logs,temp,cache} && chown -R $USER:$USER /tmp/solartunes-ram'

# Main start command - find and use the correct package manager
ExecStart=/bin/bash -c '\
    cd $PROJECT_DIR && \
    if [ -x "$HOME/.local/share/pnpm/pnpm" ]; then \
        echo "Starting with local pnpm..." && \
        exec $HOME/.local/share/pnpm/pnpm start; \
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

# Logging
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

print_status "Reloading systemd daemon..."
sudo systemctl daemon-reload

print_status "Enabling service for boot startup..."
sudo systemctl enable solartunes

print_status "Testing service startup..."
sudo systemctl start solartunes

# Wait for startup
sleep 10

# Check if service is running
if systemctl is-active --quiet solartunes; then
    print_status "✅ Service is running successfully!"
    
    # Show status
    echo ""
    echo "📊 Service Status:"
    sudo systemctl status solartunes --no-pager -l
    
    echo ""
    echo "📋 Recent Logs:"
    sudo journalctl -u solartunes -n 15 --no-pager
    
    echo ""
    echo "🌐 Access SolarTunes at: http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'localhost'):3000"
    
else
    print_error "❌ Service failed to start properly"
    
    echo ""
    echo "📊 Service Status:"
    sudo systemctl status solartunes --no-pager -l
    
    echo ""
    echo "📋 Detailed Logs:"
    sudo journalctl -u solartunes -n 30 --no-pager
    
    echo ""
    print_status "Trying manual diagnosis..."
    
    # Test manual start to see what's wrong
    echo "Testing manual start in project directory..."
    cd "$PROJECT_DIR"
    
    if [ -x "$HOME/.local/share/pnpm/pnpm" ]; then
        echo "Testing with local pnpm..."
        timeout 5s $HOME/.local/share/pnpm/pnpm start || echo "Manual start test completed"
    elif command -v pnpm >/dev/null 2>&1; then
        echo "Testing with system pnpm..."
        timeout 5s pnpm start || echo "Manual start test completed"
    elif command -v npm >/dev/null 2>&1; then
        echo "Testing with npm..."
        timeout 5s npm start || echo "Manual start test completed"
    fi
fi

print_status "Creating service monitoring script..."

# Create a script to monitor and restart the service if needed
cat > $PROJECT_DIR/scripts/monitor-service.sh << 'EOL'
#!/bin/bash

# SolarTunes Service Monitor
# Monitors the service and provides detailed status information

echo "📊 SolarTunes Service Monitor"
echo "============================"

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

# Check service status
if systemctl is-active --quiet solartunes; then
    print_status "Service is RUNNING"
    
    # Get process info
    PID=$(systemctl show solartunes --property=MainPID --value)
    if [ "$PID" != "0" ]; then
        print_status "Process ID: $PID"
        
        # Check if process is actually running
        if kill -0 $PID 2>/dev/null; then
            print_status "Process is alive and responding"
            
            # Check memory usage
            MEM=$(ps -p $PID -o rss= 2>/dev/null | awk '{print int($1/1024)"MB"}')
            print_status "Memory usage: $MEM"
            
            # Check if port 3000 is listening
            if netstat -tlnp 2>/dev/null | grep -q ":3000.*$PID/" || ss -tlnp 2>/dev/null | grep -q ":3000.*pid=$PID"; then
                print_status "Listening on port 3000"
                
                # Test HTTP response
                if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
                    print_status "HTTP server responding correctly"
                else
                    print_warning "HTTP server not responding properly"
                fi
            else
                print_warning "Not listening on port 3000"
            fi
        else
            print_error "Process ID exists but process is not running"
        fi
    else
        print_warning "No main process ID found"
    fi
else
    print_error "Service is NOT RUNNING"
    
    # Check if it's enabled
    if systemctl is-enabled --quiet solartunes; then
        print_status "Service is enabled for boot"
    else
        print_warning "Service is NOT enabled for boot"
    fi
    
    # Show recent failure logs
    echo ""
    echo "Recent failure logs:"
    sudo journalctl -u solartunes -n 10 --no-pager
fi

echo ""
echo "📋 Service Details:"
sudo systemctl status solartunes --no-pager -l

echo ""
echo "🔄 Restart Count:"
RESTART_COUNT=$(systemctl show solartunes --property=NRestarts --value)
echo "Service has been restarted $RESTART_COUNT times"

echo ""
echo "⏰ Last Start Time:"
LAST_START=$(systemctl show solartunes --property=ActiveEnterTimestamp --value)
echo "$LAST_START"

# Check for common issues
echo ""
echo "🔍 Common Issues Check:"

# Check if project directory exists
if [ -d "$HOME/solartunes" ]; then
    print_status "Project directory exists"
else
    print_error "Project directory missing"
fi

# Check if package.json exists
if [ -f "$HOME/solartunes/package.json" ]; then
    print_status "package.json exists"
else
    print_error "package.json missing"
fi

# Check if node_modules exists
if [ -d "$HOME/solartunes/node_modules" ]; then
    print_status "node_modules exists"
else
    print_error "node_modules missing - run 'pnpm install'"
fi

# Check if build exists
if [ -d "$HOME/solartunes/.next" ]; then
    print_status ".next build directory exists"
else
    print_error ".next build missing - run 'pnpm build'"
fi

# Check package managers
if command -v pnpm >/dev/null 2>&1; then
    print_status "pnpm available in PATH"
elif [ -x "$HOME/.local/share/pnpm/pnpm" ]; then
    print_status "pnpm available locally"
elif command -v npm >/dev/null 2>&1; then
    print_status "npm available"
else
    print_error "No package manager found"
fi

echo ""
echo "💡 Quick Actions:"
echo "• Restart service: sudo systemctl restart solartunes"
echo "• View live logs:  sudo journalctl -u solartunes -f"
echo "• Manual test:     cd ~/solartunes && pnpm start"
echo "• Rebuild project: ~/solartunes/scripts/rebuild-project.sh"
EOL

chmod +x $PROJECT_DIR/scripts/monitor-service.sh

print_status "Creating service restart helper..."

# Create a simple restart script
cat > $PROJECT_DIR/scripts/restart-service.sh << 'EOL'
#!/bin/bash

echo "🔄 Restarting SolarTunes Service"
echo "==============================="

# Stop the service
echo "Stopping service..."
sudo systemctl stop solartunes

# Wait a moment
sleep 3

# Start the service
echo "Starting service..."
sudo systemctl start solartunes

# Wait for startup
sleep 5

# Check status
if systemctl is-active --quiet solartunes; then
    echo "✅ Service restarted successfully!"
    echo ""
    echo "📊 Status:"
    sudo systemctl status solartunes --no-pager -l
    echo ""
    echo "🌐 Access at: http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'localhost'):3000"
else
    echo "❌ Service failed to restart"
    echo ""
    echo "📋 Logs:"
    sudo journalctl -u solartunes -n 20 --no-pager
fi
EOL

chmod +x $PROJECT_DIR/scripts/restart-service.sh

echo ""
print_status "✅ Systemd service fix complete!"
echo ""
echo "📋 New management tools:"
echo "• Monitor service:  ~/solartunes/scripts/monitor-service.sh"
echo "• Restart service:  ~/solartunes/scripts/restart-service.sh"
echo "• View logs:        sudo journalctl -u solartunes -f"
echo ""

# Final check
if systemctl is-active --quiet solartunes; then
    print_status "🎉 SolarTunes is now running as a proper daemon!"
    echo "🌐 Access at: http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'localhost'):3000"
else
    print_warning "⚠️  Service needs attention - run the monitor script for diagnosis"
    echo "📊 Run: ~/solartunes/scripts/monitor-service.sh"
fi
