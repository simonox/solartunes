#!/bin/bash

# SolarTunes Motion Sensor Setup Script
# This script sets up PIR motion detection for the SolarTunes sound player

set -e

echo "🎯 SolarTunes Motion Sensor Setup"
echo "================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user."
   exit 1
fi

# Detect environment
PREVIEW_MODE=false
if [[ "$HOME" == "/home/runner" ]] || [[ "$HOME" == "/tmp"* ]] || [[ -z "$HOME" ]]; then
    print_warning "Detected preview/sandbox environment. Running in preview mode..."
    PREVIEW_MODE=true
    PROJECT_DIR="$(pwd)"
else
    PROJECT_DIR="$HOME/solartunes"
fi

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "SolarTunes project directory not found at $PROJECT_DIR"
    print_error "Please run setup-raspberry-pi.sh first to install SolarTunes"
    exit 1
fi

cd "$PROJECT_DIR"

print_header "🔧 Step 1: Install Python Dependencies"
if [ "$PREVIEW_MODE" = true ]; then
    print_status "Preview mode: Skipping Python package installation"
else
    print_status "Installing Python GPIO and requests libraries..."
    sudo apt-get update
    sudo apt-get install -y python3-rpi.gpio python3-requests python3-pip
    
    # Install requests via pip if not available via apt
    pip3 install requests --user || print_warning "requests may already be installed"
fi

print_header "📝 Step 2: Create Motion Detection Script"
print_status "Creating motion detector Python script..."

cat > scripts/motion-detector.py << 'EOL'
#!/usr/bin/env python3
"""
SolarTunes Motion Detector
Detects motion using PIR sensor and triggers sound playback via API
"""

import time
import logging
import json
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("/tmp/motion-detector.log"),
        logging.StreamHandler()
    ]
)

# Configuration
MOTION_PIN = 17  # GPIO pin connected to motion sensor (Pin 11)
API_URL = "http://localhost:3000/api/motion"
COOLDOWN_PERIOD = 10  # Seconds between triggers
SIMULATION_MODE = False  # Set to True for testing without hardware

# Try to import GPIO, fall back to simulation if not available
try:
    import RPi.GPIO as GPIO
    GPIO_AVAILABLE = True
    logging.info("RPi.GPIO imported successfully")
except ImportError:
    GPIO_AVAILABLE = False
    SIMULATION_MODE = True
    logging.warning("RPi.GPIO not available - running in simulation mode")

# Try to import requests
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    logging.error("requests library not available - API calls will fail")

class MotionDetector:
    def __init__(self):
        self.last_motion_time = 0
        self.motion_count = 0
        
        if GPIO_AVAILABLE and not SIMULATION_MODE:
            self.setup_gpio()
        else:
            logging.info("Running in simulation mode")
    
    def setup_gpio(self):
        """Setup GPIO for motion detection"""
        try:
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(MOTION_PIN, GPIO.IN)
            GPIO.add_event_detect(
                MOTION_PIN, 
                GPIO.RISING, 
                callback=self.handle_motion, 
                bouncetime=300
            )
            logging.info(f"GPIO setup complete on pin {MOTION_PIN}")
        except Exception as e:
            logging.error(f"GPIO setup failed: {e}")
            raise
    
    def handle_motion(self, channel=None):
        """Handle motion detection event"""
        current_time = time.time()
        
        # Check cooldown period
        if current_time - self.last_motion_time < COOLDOWN_PERIOD:
            logging.info("Motion detected but still in cooldown period")
            return
        
        self.last_motion_time = current_time
        self.motion_count += 1
        
        logging.info(f"Motion detected! (Count: {self.motion_count})")
        
        # Call API to trigger motion
        self.trigger_motion_api()
    
    def trigger_motion_api(self):
        """Call SolarTunes API to trigger motion detection"""
        if not REQUESTS_AVAILABLE:
            logging.error("Cannot call API - requests library not available")
            return
        
        try:
            response = requests.post(
                API_URL,
                json={"action": "triggerMotion"},
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    logging.info(f"Motion API triggered successfully")
                    if result.get("message"):
                        logging.info(f"API message: {result['message']}")
                else:
                    logging.warning(f"API returned error: {result}")
            else:
                logging.error(f"API request failed: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            logging.error(f"API request failed: {e}")
        except Exception as e:
            logging.error(f"Unexpected error calling API: {e}")
    
    def simulate_motion(self):
        """Simulate motion detection for testing"""
        logging.info("Simulating motion detection...")
        self.handle_motion()
    
    def cleanup(self):
        """Clean up GPIO resources"""
        if GPIO_AVAILABLE and not SIMULATION_MODE:
            try:
                GPIO.cleanup()
                logging.info("GPIO cleaned up")
            except Exception as e:
                logging.error(f"GPIO cleanup failed: {e}")
    
    def run(self):
        """Main run loop"""
        logging.info("Motion detector started")
        logging.info(f"GPIO Pin: {MOTION_PIN}")
        logging.info(f"API URL: {API_URL}")
        logging.info(f"Cooldown: {COOLDOWN_PERIOD}s")
        logging.info(f"Simulation mode: {SIMULATION_MODE}")
        
        if SIMULATION_MODE:
            logging.info("Running in simulation mode - motion will be simulated every 30 seconds")
        
        try:
            if SIMULATION_MODE:
                # Simulation mode for testing
                while True:
                    time.sleep(30)  # Wait 30 seconds
                    self.simulate_motion()
            else:
                # Real hardware mode
                while True:
                    time.sleep(1)
                    
        except KeyboardInterrupt:
            logging.info("Motion detector stopped by user")
        except Exception as e:
            logging.error(f"Unexpected error: {e}")
        finally:
            self.cleanup()

if __name__ == "__main__":
    detector = MotionDetector()
    detector.run()
EOL

chmod +x scripts/motion-detector.py

print_header "🔧 Step 3: Create Motion Detection Service"
if [ "$PREVIEW_MODE" = true ]; then
    print_status "Preview mode: Skipping systemd service creation"
else
    print_status "Creating systemd service for motion detection..."
    
    sudo tee /etc/systemd/system/motion-detector.service > /dev/null << EOL
[Unit]
Description=SolarTunes Motion Detector
After=network.target solartunes.service
Wants=solartunes.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR
Environment=PYTHONPATH=/usr/lib/python3/dist-packages
ExecStart=/usr/bin/python3 $PROJECT_DIR/scripts/motion-detector.py
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=motion-detector

[Install]
WantedBy=multi-user.target
EOL
fi

print_header "📝 Step 4: Create Motion Test Script"
print_status "Creating motion sensor test script..."

cat > scripts/test-motion-sensor.sh << 'EOL'
#!/bin/bash

# Motion Sensor Test Script
echo "🎯 Testing Motion Sensor"
echo "========================"

PROJECT_DIR="$HOME/solartunes"
cd "$PROJECT_DIR"

echo ""
echo "1. Testing Python script directly..."
timeout 10s python3 scripts/motion-detector.py || echo "Test completed"

echo ""
echo "2. Checking GPIO pin status..."
if command -v gpio &> /dev/null; then
    gpio readall | grep -A5 -B5 "17"
else
    echo "gpio command not available (install wiringpi for detailed GPIO info)"
fi

echo ""
echo "3. Testing API endpoint..."
curl -X POST http://localhost:3000/api/motion \
     -H "Content-Type: application/json" \
     -d '{"action": "triggerMotion"}' \
     2>/dev/null || echo "API test failed - make sure SolarTunes is running"

echo ""
echo "4. Checking service status..."
if command -v systemctl &> /dev/null; then
    systemctl is-active motion-detector 2>/dev/null && echo "✅ Motion detector service is running" || echo "❌ Motion detector service is not running"
else
    echo "systemctl not available"
fi

echo ""
echo "5. Recent motion detector logs..."
if [ -f "/tmp/motion-detector.log" ]; then
    echo "Last 10 lines from motion detector log:"
    tail -10 /tmp/motion-detector.log
else
    echo "No motion detector log found"
fi

echo ""
echo "Test complete!"
EOL

chmod +x scripts/test-motion-sensor.sh

print_header "📝 Step 5: Create Motion Management Scripts"
print_status "Creating motion detector management scripts..."

# Start script
cat > scripts/start-motion-detector.sh << 'EOL'
#!/bin/bash
echo "🎯 Starting Motion Detector..."

if command -v systemctl &> /dev/null; then
    sudo systemctl start motion-detector
    if systemctl is-active --quiet motion-detector; then
        echo "✅ Motion detector started successfully!"
    else
        echo "❌ Failed to start motion detector"
        exit 1
    fi
else
    echo "Starting motion detector manually..."
    cd "$HOME/solartunes"
    python3 scripts/motion-detector.py &
    echo "✅ Motion detector started in background"
fi
EOL

# Stop script
cat > scripts/stop-motion-detector.sh << 'EOL'
#!/bin/bash
echo "🛑 Stopping Motion Detector..."

if command -v systemctl &> /dev/null; then
    sudo systemctl stop motion-detector
    echo "✅ Motion detector stopped"
else
    echo "Stopping motion detector processes..."
    pkill -f motion-detector.py || echo "No motion detector processes found"
    echo "✅ Motion detector stopped"
fi
EOL

# Status script
cat > scripts/status-motion-detector.sh << 'EOL'
#!/bin/bash
echo "📊 Motion Detector Status"
echo "========================"

if command -v systemctl &> /dev/null; then
    echo "Service status:"
    sudo systemctl status motion-detector --no-pager
    
    echo ""
    echo "Recent logs:"
    sudo journalctl -u motion-detector -n 10 --no-pager
else
    echo "Process status:"
    pgrep -f motion-detector.py && echo "✅ Motion detector is running" || echo "❌ Motion detector is not running"
fi

echo ""
echo "Motion detector log:"
if [ -f "/tmp/motion-detector.log" ]; then
    tail -10 /tmp/motion-detector.log
else
    echo "No log file found"
fi
EOL

chmod +x scripts/start-motion-detector.sh
chmod +x scripts/stop-motion-detector.sh
chmod +x scripts/status-motion-detector.sh

print_header "🔧 Step 6: Enable and Start Services"
if [ "$PREVIEW_MODE" = true ]; then
    print_status "Preview mode: Skipping service management"
else
    print_status "Enabling and starting motion detector service..."
    sudo systemctl daemon-reload
    sudo systemctl enable motion-detector
    
    # Make sure SolarTunes is running first
    if ! systemctl is-active --quiet solartunes; then
        print_status "Starting SolarTunes service first..."
        sudo systemctl start solartunes
        sleep 3
    fi
    
    # Start motion detector
    sudo systemctl start motion-detector
    sleep 2
    
    if systemctl is-active --quiet motion-detector; then
        print_status "✅ Motion detector service started successfully!"
    else
        print_warning "❌ Motion detector service failed to start"
        print_status "Check status with: sudo systemctl status motion-detector"
    fi
fi

print_header "📋 Step 7: Hardware Connection Guide"
echo ""
echo "🔌 PIR Motion Sensor Wiring:"
echo "=============================="
echo ""
echo "PIR Sensor Pin  →  Raspberry Pi Pin"
echo "─────────────────────────────────────"
echo "VCC (Power)     →  Pin 2 (5V) or Pin 1 (3.3V)"
echo "OUT (Signal)    →  Pin 11 (GPIO17)"
echo "GND (Ground)    →  Pin 6 (Ground)"
echo ""
echo "📍 Pin Layout Reference:"
echo "Pin 1  (3.3V)     Pin 2  (5V)"
echo "Pin 3  (GPIO2)    Pin 4  (5V)"
echo "Pin 5  (GPIO3)    Pin 6  (Ground) ← Connect GND here"
echo "Pin 7  (GPIO4)    Pin 8  (GPIO14)"
echo "Pin 9  (Ground)   Pin 10 (GPIO15)"
echo "Pin 11 (GPIO17) ← Pin 12 (GPIO18)  ← Connect OUT here"
echo ""

print_header "🧪 Step 8: Testing Instructions"
echo ""
echo "1. Connect your PIR sensor according to the wiring diagram above"
echo "2. Run the test script:"
echo "   ./scripts/test-motion-sensor.sh"
echo ""
echo "3. Test motion detection in the web interface:"
echo "   - Open http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'localhost'):3000"
echo "   - Enable motion detection"
echo "   - Select a sound file for motion triggering"
echo "   - Wave your hand in front of the PIR sensor"
echo ""
echo "4. Check logs if needed:"
echo "   sudo journalctl -u motion-detector -f"
echo "   tail -f /tmp/motion-detector.log"
echo ""

print_header "🔧 Management Commands"
echo ""
echo "Start motion detector:  ./scripts/start-motion-detector.sh"
echo "Stop motion detector:   ./scripts/stop-motion-detector.sh"
echo "Check status:          ./scripts/status-motion-detector.sh"
echo "Test sensor:           ./scripts/test-motion-sensor.sh"
echo ""

print_header "⚙️ Troubleshooting"
echo ""
echo "If motion detection doesn't work:"
echo "1. Check wiring connections"
echo "2. Verify the PIR sensor has power (usually has a small LED)"
echo "3. Adjust sensitivity potentiometer on the PIR sensor"
echo "4. Check logs: sudo journalctl -u motion-detector -f"
echo "5. Test the API manually: curl -X POST http://localhost:3000/api/motion -H 'Content-Type: application/json' -d '{\"action\": \"triggerMotion\"}'"
echo ""

if [ "$PREVIEW_MODE" = true ]; then
    print_header "✅ Preview Setup Complete!"
    echo ""
    print_status "Motion sensor setup completed in preview mode! 🎉"
    echo ""
    echo "📋 In a real Raspberry Pi environment:"
    echo "1. Python GPIO libraries would be installed"
    echo "2. Systemd service would be created and started"
    echo "3. Hardware connection guide provided above"
    echo "4. All management scripts created and ready to use"
    echo ""
    echo "🔌 Connect your PIR sensor and run the test script to verify!"
else
    print_header "✅ Motion Sensor Setup Complete!"
    echo ""
    print_status "Motion sensor has been successfully set up! 🎉"
    echo ""
    echo "📋 What was installed:"
    echo "• Python motion detection script"
    echo "• Systemd service for automatic startup"
    echo "• Test and management scripts"
    echo "• Hardware connection guide"
    echo ""
    echo "🔌 Next steps:"
    echo "1. Connect your PIR sensor according to the wiring guide above"
    echo "2. Run: ./scripts/test-motion-sensor.sh"
    echo "3. Configure motion detection in the web interface"
    echo ""
    echo "🌐 Access SolarTunes: http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'localhost'):3000"
fi
