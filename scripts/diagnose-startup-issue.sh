#!/bin/bash

# Diagnose SolarTunes Startup Issues
# Comprehensive diagnostic to identify why the service won't stay running

echo "🔍 Diagnosing SolarTunes Startup Issues"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}$1${NC}"
}

PROJECT_DIR="$HOME/solartunes"
cd "$PROJECT_DIR" || { echo "Cannot find project directory"; exit 1; }

print_header "📋 Step 1: Basic Environment Check"
echo "=================================="

# Check current directory and files
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

echo ""
echo "Package managers available:"
if command -v pnpm >/dev/null 2>&1; then
    echo "✓ pnpm: $(which pnpm) ($(pnpm --version))"
elif [ -x "$HOME/.local/share/pnpm/pnpm" ]; then
    echo "✓ pnpm (local): $HOME/.local/share/pnpm/pnpm"
elif command -v npm >/dev/null 2>&1; then
    echo "✓ npm: $(which npm) ($(npm --version))"
else
    print_error "No package manager found!"
fi

if command -v node >/dev/null 2>&1; then
    echo "✓ node: $(which node) ($(node --version))"
else
    print_error "Node.js not found!"
fi

print_header "📋 Step 2: Project Structure Check"
echo "================================="

# Check essential files
essential_files=(
    "package.json"
    "next.config.js"
    "app/page.tsx"
    "app/layout.tsx"
    "app/globals.css"
)

for file in "${essential_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "$file exists"
    else
        print_error "$file missing"
    fi
done

print_header "📋 Step 3: Package.json Analysis"
echo "==============================="

if [ -f "package.json" ]; then
    echo "Package.json contents:"
    cat package.json
    echo ""
    
    # Check if start script exists
    if grep -q '"start"' package.json; then
        start_script=$(grep '"start"' package.json | cut -d'"' -f4)
        print_status "Start script found: $start_script"
    else
        print_error "No start script in package.json"
    fi
else
    print_error "package.json not found"
fi

print_header "📋 Step 4: Dependencies Check"
echo "============================"

if [ -d "node_modules" ]; then
    print_status "node_modules directory exists"
    echo "Size: $(du -sh node_modules | cut -f1)"
    
    # Check for key dependencies
    key_deps=("next" "react" "react-dom")
    for dep in "${key_deps[@]}"; do
        if [ -d "node_modules/$dep" ]; then
            print_status "$dep installed"
        else
            print_error "$dep missing"
        fi
    done
else
    print_error "node_modules directory missing"
fi

print_header "📋 Step 5: Build Check"
echo "===================="

if [ -d ".next" ]; then
    print_status ".next build directory exists"
    echo "Build size: $(du -sh .next | cut -f1)"
    
    if [ -f ".next/BUILD_ID" ]; then
        print_status "Build ID: $(cat .next/BUILD_ID)"
    fi
else
    print_error ".next build directory missing"
fi

print_header "📋 Step 6: Manual Start Test"
echo "=========================="

echo "Testing manual start..."

# Try to start manually and capture output
echo "Attempting to start with available package manager..."

if command -v pnpm >/dev/null 2>&1; then
    echo "Testing with pnpm..."
    timeout 10s pnpm start 2>&1 | head -20
elif [ -x "$HOME/.local/share/pnpm/pnpm" ]; then
    echo "Testing with local pnpm..."
    timeout 10s $HOME/.local/share/pnpm/pnpm start 2>&1 | head -20
elif command -v npm >/dev/null 2>&1; then
    echo "Testing with npm..."
    timeout 10s npm start 2>&1 | head -20
else
    print_error "No package manager available for testing"
fi

print_header "📋 Step 7: Service Logs Analysis"
echo "==============================="

echo "Recent service logs:"
sudo journalctl -u solartunes -n 50 --no-pager

print_header "📋 Step 8: Port Check"
echo "=================="

echo "Checking if port 3000 is in use:"
if command -v netstat >/dev/null 2>&1; then
    netstat -tlnp | grep :3000 || echo "Port 3000 is free"
elif command -v ss >/dev/null 2>&1; then
    ss -tlnp | grep :3000 || echo "Port 3000 is free"
else
    echo "Cannot check port status"
fi

print_header "📋 Step 9: Permissions Check"
echo "=========================="

echo "File permissions:"
ls -la package.json 2>/dev/null || echo "package.json not found"
ls -la next.config.js 2>/dev/null || echo "next.config.js not found"

echo ""
echo "Directory ownership:"
ls -ld . node_modules .next 2>/dev/null

print_header "📋 Step 10: System Resources"
echo "=========================="

echo "Available memory:"
free -h

echo ""
echo "Disk space:"
df -h .

echo ""
echo "CPU load:"
uptime

print_header "🔧 Recommended Actions"
echo "===================="

echo ""
echo "Based on the diagnosis above, try these fixes in order:"
echo ""
echo "1. If package.json is missing or incomplete:"
echo "   ./scripts/deploy-project.sh"
echo ""
echo "2. If node_modules is missing:"
echo "   pnpm install  # or npm install"
echo ""
echo "3. If .next build is missing:"
echo "   pnpm build    # or npm run build"
echo ""
echo "4. If there are permission issues:"
echo "   sudo chown -R \$USER:\$USER ~/solartunes"
echo ""
echo "5. If port 3000 is busy:"
echo "   sudo pkill -f 'node.*3000'"
echo ""
echo "6. If all else fails, try a complete rebuild:"
echo "   ./scripts/rebuild-project.sh"
