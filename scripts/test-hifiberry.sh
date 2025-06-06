#!/bin/bash

# HiFiBerry DAC+ Testing Script for SolarTunes
# Specific tests for HiFiBerry DAC+ audio HAT

echo "🎵 HiFiBerry DAC+ Audio Testing Script"
echo "======================================"

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

MUSIC_DIR="$HOME/Music"

print_status "Testing HiFiBerry DAC+ configuration..."

echo ""
echo "🔧 HiFiBerry DAC+ Detection:"
if lsmod | grep -q "snd_rpi_hifiberry"; then
    print_status "HiFiBerry DAC+ driver loaded"
    lsmod | grep hifiberry
else
    print_error "HiFiBerry DAC+ driver not loaded"
fi

echo ""
echo "🎛️ HiFiBerry DAC+ Controls:"
echo "Available mixer controls:"
amixer -c 0 controls

echo ""
echo "Current volume settings:"
amixer -c 0 sget 'Digital Playback Volume' 2>/dev/null || echo "No Digital Playback Volume control"
amixer -c 0 sget 'Analogue Playback Volume' 2>/dev/null || echo "No Analogue Playback Volume control"

echo ""
echo "📊 Hardware Information:"
echo "Sound card info:"
cat /proc/asound/card0/id 2>/dev/null || echo "No card info"

echo "PCM info:"
cat /proc/asound/card0/pcm0p/info 2>/dev/null || echo "No PCM info"

echo ""
echo "🎵 HiFiBerry DAC+ Playback Tests:"

# Find a test file
TEST_FILE=""
for file in "$MUSIC_DIR"/*.wav; do
    if [ -f "$file" ]; then
        TEST_FILE="$file"
        break
    fi
done

if [ -z "$TEST_FILE" ]; then
    print_warning "No .wav files found in $MUSIC_DIR"
    exit 1
fi

print_status "Testing with file: $(basename "$TEST_FILE")"

echo ""
echo "🔊 Test 1: Direct hardware access"
print_status "aplay -D hw:0,0 (direct HiFiBerry DAC+ access)"
timeout 3s aplay -D hw:0,0 "$TEST_FILE" 2>&1 || print_warning "Direct hardware test completed"

echo ""
echo "🔊 Test 2: Specific format for HiFiBerry DAC+"
print_status "aplay with S32_LE format (32-bit)"
timeout 3s aplay -D hw:0,0 -f S32_LE -r 44100 -c 2 "$TEST_FILE" 2>&1 || print_warning "S32_LE format test completed"

echo ""
echo "🔊 Test 3: Alternative format"
print_status "aplay with S16_LE format (16-bit)"
timeout 3s aplay -D hw:0,0 -f S16_LE -r 44100 -c 2 "$TEST_FILE" 2>&1 || print_warning "S16_LE format test completed"

echo ""
echo "🔊 Test 4: Check if file format matches DAC"
print_status "File format analysis:"
file "$TEST_FILE"
if command -v soxi &> /dev/null; then
    soxi "$TEST_FILE"
elif command -v mediainfo &> /dev/null; then
    mediainfo "$TEST_FILE"
else
    print_warning "Install sox or mediainfo for detailed file analysis"
fi

echo ""
echo "🔧 HiFiBerry DAC+ Specific Recommendations:"
echo ""
echo "1. Use direct hardware access: -D hw:0,0"
echo "2. Match audio format to your files:"
echo "   - For 16-bit files: -f S16_LE"
echo "   - For 24-bit files: -f S24_LE" 
echo "   - For 32-bit files: -f S32_LE"
echo "3. HiFiBerry DAC+ may not support software volume control"
echo "4. Check /boot/config.txt for proper HiFiBerry configuration:"
echo "   dtoverlay=hifiberry-dacplus"
echo ""
echo "5. Verify audio group membership:"
groups $USER | grep audio || print_warning "User not in audio group"

echo ""
echo "6. Test volume controls:"
echo "Digital Playback Volume:"
amixer -c 0 sset 'Digital Playback Volume' 80% 2>/dev/null && echo "✅ Digital volume control works" || echo "❌ Digital volume control failed"

echo "Analogue Playback Volume:"
amixer -c 0 sset 'Analogue Playback Volume' 80% 2>/dev/null && echo "✅ Analogue volume control works" || echo "❌ Analogue volume control failed"

print_status "HiFiBerry DAC+ testing complete!"
