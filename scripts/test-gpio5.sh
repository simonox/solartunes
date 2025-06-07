#!/bin/bash

echo "🧪 Testing GPIO5 Motion Sensor"
echo "=============================="

# Test GPIO5 specifically
echo "1. Testing GPIO5 pin access..."
if command -v gpio &> /dev/null; then
    echo "GPIO5 status:"
    gpio -g mode 5 in
    gpio -g read 5
    echo "GPIO5 value: $(gpio -g read 5)"
else
    echo "gpio command not available"
fi

echo ""
echo "2. Testing Python GPIO5 access..."
python3 -c "
try:
    import RPi.GPIO as GPIO
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(5, GPIO.IN)
    value = GPIO.input(5)
    print(f'GPIO5 value: {value}')
    GPIO.cleanup()
    print('✅ GPIO5 test successful')
except Exception as e:
    print(f'❌ GPIO5 test failed: {e}')
" 2>/dev/null || echo "Python GPIO test failed"

echo ""
echo "3. Checking for GPIO conflicts..."
if [ -f "/sys/kernel/debug/gpio" ]; then
    echo "GPIO5 usage:"
    sudo cat /sys/kernel/debug/gpio | grep -A2 -B2 "gpio-5" || echo "GPIO5 appears to be free"
else
    echo "GPIO debug info not available"
fi

echo ""
echo "4. Testing motion detector script..."
if [ -f "$HOME/solartunes/scripts/motion-detector.py" ]; then
    echo "Running motion detector for 5 seconds..."
    cd "$HOME/solartunes"
    timeout 5s python3 scripts/motion-detector.py || echo "Test completed"
else
    echo "Motion detector script not found"
fi

echo ""
echo "✅ GPIO5 testing complete!"
echo "Connect your PIR sensor OUT pin to Raspberry Pi Pin 29 (GPIO5)"
