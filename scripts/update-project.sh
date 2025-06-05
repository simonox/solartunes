#!/bin/bash

# SolarTunes Update Script
# Updates the project and restarts the service

set -e

echo "🔄 SolarTunes Update Script"
echo "=========================="

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

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ -d "$PROJECT_DIR" ]; then
    print_status "Changing to project directory: $PROJECT_DIR"
    cd "$PROJECT_DIR"
elif [ ! -f "package.json" ]; then
    print_error "Cannot find SolarTunes project. Please run from project directory or ensure it's installed at $PROJECT_DIR"
    exit 1
fi

print_status "Stopping SolarTunes service..."
if command -v systemctl &> /dev/null; then
    sudo systemctl stop solartunes || print_warning "Could not stop service (may not be running)"
else
    ./scripts/stop-solartunes.sh || print_warning "Could not stop service (may not be running)"
fi

print_status "Updating project from Git..."
if [ -d ".git" ]; then
    git pull
else
    print_warning "Not a Git repository - skipping Git update"
fi

print_status "Updating dependencies..."
if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v npm &> /dev/null; then
    npm install
else
    print_error "No package manager found (pnpm or npm required)"
    exit 1
fi

print_status "Building project..."
if command -v pnpm &> /dev/null; then
    pnpm build
elif command -v npm &> /dev/null; then
    npm run build
fi

print_status "Starting SolarTunes service..."
if command -v systemctl &> /dev/null; then
    sudo systemctl start solartunes
    
    # Wait for service to start
    sleep 3
    
    if systemctl is-active --quiet solartunes; then
        print_status "✅ Update complete! SolarTunes is running."
    else
        print_error "❌ Service failed to start after update"
        echo "Check status with: sudo systemctl status solartunes"
        exit 1
    fi
else
    ./scripts/start-solartunes.sh
fi

print_status "Update complete! Service status:"
if command -v systemctl &> /dev/null; then
    sudo systemctl status solartunes --no-pager -l
else
    echo "Service restarted in development mode"
fi

echo ""
print_status "🌐 Access your updated sound player at: http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'localhost'):3000"
