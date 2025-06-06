#!/bin/bash

# Audio Testing Script for SolarTunes
# Tests various audio configurations and playback methods

echo "🎵 SolarTunes Audio Testing Script"
echo "================================="

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

print_status "Testing audio system configuration..."

echo ""
echo "🔧 Audio Devices:"
if command -v aplay &> /dev/null; then
    aplay -l
else
    print_error "aplay not found"
fi

echo ""
echo "🎛️ Audio Controls:"
if command -v amixer &> /dev/null; then
    amixer -c 0 controls | head -10
    echo "..."
    echo "Total controls: $(amixer -c 0 controls | wc -l)"
else
    print_error "amixer not found"
fi

echo ""
echo "📊 ALSA Status:"
if [ -d "/proc/asound" ]; then
    echo "Sound cards:"
    cat /proc/asound/cards 2>/dev/null || echo "No cards found"
    
    echo ""
    echo "PCM devices:"
    cat /proc/asound/pcm 2>/dev/null || echo "No PCM devices found"
else
    print_error "/proc/asound not found"
fi

echo ""
echo "🎵 Testing Audio Playback:"

if [ ! -d "$MUSIC_DIR" ]; then
    print_error "Music directory $MUSIC_DIR not found"
    exit 1
fi

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
    print_status "Creating a test tone..."
    
    if command -v sox &> /dev/null; then
        sox -n -r 44100 -c 2 "$MUSIC_DIR/test-tone.wav" synth 2 sine 440
        TEST_FILE="$MUSIC_DIR/test-tone.wav"
        print_status "Created test tone: $TEST_FILE"
    else
        print_error "sox not found, cannot create test file"
        exit 1
    fi
fi

print_status "Testing with file: $(basename "$TEST_FILE")"

echo ""
echo "🔊 Test 1: Basic aplay"
timeout 3s aplay "$TEST_FILE" 2>&1 || print_warning "Basic aplay test completed/failed"

echo ""
echo "🔊 Test 2: aplay with device specification"
timeout 3s aplay -D default "$TEST_FILE" 2>&1 || print_warning "Device-specific aplay test completed/failed"

echo ""
echo "🔊 Test 3: aplay with format specification"
timeout 3s aplay -D default -f cd "$TEST_FILE" 2>&1 || print_warning "Format-specific aplay test completed/failed"

echo ""
echo "🔊 Test 4: aplay in background (detached)"
aplay -D default -f cd "$TEST_FILE" &
APLAY_PID=$!
print_status "Started aplay in background with PID: $APLAY_PID"
sleep 2
if kill -0 $APLAY_PID 2>/dev/null; then
    print_status "Background aplay is still running"
    kill $APLAY_PID 2>/dev/null
    print_status "Stopped background aplay"
else
    print_warning "Background aplay exited early"
fi

echo ""
echo "📋 Process Information:"
echo "Current aplay processes:"
pgrep -f aplay || echo "No aplay processes running"

echo ""
echo "🔧 Audio Configuration Recommendations:"
echo "1. Ensure your user is in the 'audio' group:"
echo "   groups \$USER | grep audio"
echo ""
echo "2. Check ALSA configuration:"
echo "   cat ~/.asoundrc"
echo ""
echo "3. Test volume control:"
echo "   amixer -c 0 sset 'Master' 50%"
echo ""
echo "4. For long files, consider using:"
echo "   - Detached processes (detached: true)"
echo "   - Process monitoring"
echo "   - Alternative players (mpg123, vlc)"

print_status "Audio testing complete!"
