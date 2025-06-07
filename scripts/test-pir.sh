#!/bin/bash

echo "🎯 PIR Motion Sensor Test Menu"
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

# Check if we're in the right directory
if [ ! -d "scripts" ]; then
    cd ~/solartunes || { print_error "Could not find solartunes directory"; exit 1; }
fi

# Make sure all scripts are executable
chmod +x scripts/test-pir-updated.py
chmod +x scripts/test-pir-gpiozero.py
chmod +x scripts/gpio-diagnostic.py
chmod +x scripts/install-gpio-libraries.sh

echo ""
echo "Choose a test option:"
echo "1) Run diagnostic (recommended first)"
echo "2) Test with RPi.GPIO library"
echo "3) Test with gpiozero library"
echo "4) Install/update GPIO libraries"
echo "5) Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        print_status "Running GPIO diagnostic..."
        python3 scripts/gpio-diagnostic.py
        ;;
    2)
        print_status "Testing PIR sensor with RPi.GPIO..."
        python3 scripts/test-pir-updated.py
        ;;
    3)
        print_status "Testing PIR sensor with gpiozero..."
        python3 scripts/test-pir-gpiozero.py
        ;;
    4)
        print_status "Installing/updating GPIO libraries..."
        ./scripts/install-gpio-libraries.sh
        ;;
    5)
        print_status "Exiting..."
        exit 0
        ;;
    *)
        print_error "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
print_status "Test complete!"
