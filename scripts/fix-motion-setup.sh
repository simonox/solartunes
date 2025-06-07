#!/bin/bash

echo "🔧 Motion Detector Quick Fix"
echo "============================"

# Ensure we're in the right place
cd ~/solartunes || { echo "Error: solartunes directory not found"; exit 1; }

# Create a simple motion detector script
cat > scripts/simple-motion-detector.py << 'EOL'
#!/usr/bin/env python3
import time
import logging

# Simple logging setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

print("🎯 Simple Motion Detector Starting...")
logging.info("Motion detector started in test mode")

# Test mode - simulate motion every 30 seconds
try:
    while True:
        time.sleep(30)
        logging.info("Simulated motion detected!")
        
        # Try to call API
        try:
            import requests
            response = requests.post(
                "http://localhost:3000/api/motion",
                json={"action": "triggerMotion"},
                timeout=5
            )
            if response.status_code == 200:
                logging.info("API call successful")
            else:
                logging.error(f"API call failed: {response.status_code}")
        except Exception as e:
            logging.error(f"API call error: {e}")
            
except KeyboardInterrupt:
    logging.info("Motion detector stopped")
EOL

chmod +x scripts/simple-motion-detector.py

echo "✅ Simple motion detector created"
echo "Test it with: python3 scripts/simple-motion-detector.py"
