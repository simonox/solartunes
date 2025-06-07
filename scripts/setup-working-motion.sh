#!/bin/bash

echo "🎯 Setting up Working Motion Detection for SolarTunes"
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

PROJECT_DIR="$HOME/solartunes"
cd "$PROJECT_DIR" || { print_error "Could not find solartunes directory"; exit 1; }

print_status "Since test-pir-updated.py is working, setting up production motion detector..."

# Create the production motion detector script based on the working test
cat > scripts/motion-detector.py << 'EOL'
#!/usr/bin/env python3
"""
SolarTunes Motion Detector - Production Version
Based on working test-pir-updated.py script
"""

import RPi.GPIO as GPIO
import time
import requests
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
MOTION_PIN = 5  # GPIO5 (Pin 29) - confirmed working
API_URL = "http://localhost:3000/api/motion"
COOLDOWN_PERIOD = 10  # Seconds between API calls
STABILIZATION_TIME = 2  # Seconds to wait for sensor to stabilize

class MotionDetector:
    def __init__(self):
        self.last_motion_time = 0
        self.motion_count = 0
        self.setup_gpio()
        
    def setup_gpio(self):
        """Setup GPIO using the same method as working test script"""
        try:
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(MOTION_PIN, GPIO.IN)
            logging.info(f"GPIO setup complete on pin {MOTION_PIN}")
        except Exception as e:
            logging.error(f"GPIO setup failed: {e}")
            raise
    
    def call_api(self):
        """Call SolarTunes API to trigger motion detection"""
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
                    logging.info("Motion API triggered successfully")
                    if result.get("message"):
                        logging.info(f"API response: {result['message']}")
                else:
                    logging.warning(f"API returned error: {result}")
            else:
                logging.error(f"API request failed: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            logging.error(f"API request failed: {e}")
        except Exception as e:
            logging.error(f"Unexpected error calling API: {e}")
    
    def run(self):
        """Main detection loop - based on working test script"""
        logging.info("Motion detector started")
        logging.info(f"Using GPIO pin {MOTION_PIN}")
        logging.info(f"API URL: {API_URL}")
        logging.info(f"Cooldown period: {COOLDOWN_PERIOD}s")
        
        try:
            # Stabilize sensor (same as working test)
            logging.info(f"Stabilizing sensor for {STABILIZATION_TIME} seconds...")
            time.sleep(STABILIZATION_TIME)
            logging.info("Sensor stabilized. Watching for motion...")
            
            while True:
                if GPIO.input(MOTION_PIN):
                    current_time = time.time()
                    
                    # Check cooldown period
                    if current_time - self.last_motion_time >= COOLDOWN_PERIOD:
                        self.motion_count += 1
                        self.last_motion_time = current_time
                        
                        logging.info(f"Motion detected! (Count: {self.motion_count})")
                        self.call_api()
                        
                        # Wait 1 second after detection (same as test script)
                        time.sleep(1)
                    else:
                        logging.debug("Motion detected but still in cooldown period")
                
                # Same loop delay as working test script
                time.sleep(0.1)
                
        except KeyboardInterrupt:
            logging.info("Motion detector stopped by user")
        except Exception as e:
            logging.error(f"Unexpected error: {e}")
        finally:
            GPIO.cleanup()
            logging.info("GPIO cleaned up")

if __name__ == "__main__":
    detector = MotionDetector()
    detector.run()
EOL

chmod +x scripts/motion-detector.py

print_status "✅ Production motion detector script created"

# Update the systemd service
print_status "Creating/updating systemd service..."

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

# Reload and enable the service
sudo systemctl daemon-reload
sudo systemctl enable motion-detector

print_status "✅ Systemd service configured"

# Create a quick test script
cat > scripts/test-motion-integration.sh << 'EOL'
#!/bin/bash

echo "🧪 Testing Motion Detection Integration"
echo "====================================="

# Check if SolarTunes is running
if ! systemctl is-active --quiet solartunes; then
    echo "❌ SolarTunes service is not running"
    echo "Start it with: sudo systemctl start solartunes"
    exit 1
fi

echo "✅ SolarTunes is running"

# Test the API endpoint directly
echo ""
echo "Testing API endpoint..."
response=$(curl -s -X POST http://localhost:3000/api/motion \
     -H "Content-Type: application/json" \
     -d '{"action": "triggerMotion"}')

if echo "$response" | grep -q "success"; then
    echo "✅ API endpoint is working"
    echo "Response: $response"
else
    echo "❌ API endpoint failed"
    echo "Response: $response"
fi

# Test motion detector script for 10 seconds
echo ""
echo "Testing motion detector script for 10 seconds..."
echo "Wave your hand in front of the PIR sensor!"

timeout 10s python3 scripts/motion-detector.py || echo "Test completed"

echo ""
echo "Integration test complete!"
EOL

chmod +x scripts/test-motion-integration.sh

print_status "✅ Integration test script created"

# Start the motion detector service
print_status "Starting motion detector service..."

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

echo ""
print_status "🎉 Setup Complete!"
echo ""
echo "📋 What's been set up:"
echo "• Production motion detector script (based on your working test)"
echo "• Systemd service for automatic startup"
echo "• Integration test script"
echo ""
echo "🧪 Test the integration:"
echo "1. Run: ./scripts/test-motion-integration.sh"
echo "2. Open the web interface and enable motion detection"
echo "3. Select a sound file for motion triggering"
echo "4. Wave your hand in front of the PIR sensor"
echo ""
echo "📊 Monitor the system:"
echo "• Check logs: sudo journalctl -u motion-detector -f"
echo "• Check status: sudo systemctl status motion-detector"
echo "• View motion log: tail -f /tmp/motion-detector.log"
echo ""
echo "🌐 Web interface: http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'localhost'):3000"
