#!/bin/bash

echo "🔧 Installing/Updating GPIO Libraries for Raspberry Pi"
echo "===================================================="

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

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi\|BCM\|Broadcom" /proc/cpuinfo 2>/dev/null; then
    print_warning "This doesn't appear to be a Raspberry Pi."
    print_warning "The script will continue, but libraries may not work correctly."
fi

print_status "Updating package lists..."
sudo apt-get update

print_status "Installing/updating RPi.GPIO..."
sudo apt-get install -y python3-rpi.gpio

print_status "Installing/updating gpiozero..."
sudo apt-get install -y python3-gpiozero

print_status "Installing/updating pigpio..."
sudo apt-get install -y pigpio python3-pigpio

# Check if libraries were installed successfully
echo ""
print_status "Verifying installations:"

# Check RPi.GPIO
if python3 -c "import RPi.GPIO; print(f'RPi.GPIO version: {RPi.GPIO.VERSION}')" 2>/dev/null; then
    print_status "✅ RPi.GPIO installed successfully"
else
    print_error "❌ RPi.GPIO installation failed"
fi

# Check gpiozero
if python3 -c "import gpiozero; print(f'gpiozero version: {gpiozero.__version__}')" 2>/dev/null; then
    print_status "✅ gpiozero installed successfully"
else
    print_error "❌ gpiozero installation failed"
fi

# Check pigpio
if python3 -c "import pigpio; print('pigpio imported successfully')" 2>/dev/null; then
    print_status "✅ pigpio installed successfully"
else
    print_error "❌ pigpio installation failed"
fi

echo ""
print_status "Starting pigpio daemon..."
sudo systemctl start pigpiod
sudo systemctl enable pigpiod

echo ""
print_status "Installation complete!"
echo ""
print_status "Try these test scripts:"
echo "1. python3 scripts/test-pir-updated.py     (uses RPi.GPIO)"
echo "2. python3 scripts/test-pir-gpiozero.py    (uses gpiozero)"
echo "3. python3 scripts/gpio-diagnostic.py      (diagnoses GPIO issues)"
