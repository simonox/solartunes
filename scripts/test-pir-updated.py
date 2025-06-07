#!/usr/bin/env python3
"""
Modern PIR motion sensor test script for Raspberry Pi
Uses GPIO5 (Pin 29) for motion detection
"""
import RPi.GPIO as GPIO
import time
import sys

# Print Python and RPi.GPIO versions for debugging
print(f"Python version: {sys.version}")
print(f"RPi.GPIO version: {GPIO.VERSION}")

# Use BCM pin numbering (GPIO numbers instead of physical pin numbers)
GPIO.setmode(GPIO.BCM)
PIR_PIN = 5  # GPIO5 (Pin 29)

# Set up the PIR sensor pin as input
GPIO.setup(PIR_PIN, GPIO.IN)

print(f"PIR Motion Sensor Test (GPIO{PIR_PIN})")
print("----------------------------------------")
print("Press CTRL+C to exit")
print("Waiting for sensor to settle (5 sec)...")

# Give the sensor time to settle
time.sleep(5)
print("Ready! Watching for motion...")

try:
    motion_count = 0
    while True:
        if GPIO.input(PIR_PIN):
            motion_count += 1
            print(f"🔍 Motion Detected! (Count: {motion_count})")
            
            # Wait a moment before checking again to avoid multiple triggers
            time.sleep(1)
        else:
            # Print a status dot every 10 iterations to show the script is running
            if motion_count % 10 == 0:
                print(".", end="", flush=True)
        
        # Short delay between checks
        time.sleep(0.1)

except KeyboardInterrupt:
    print("\nTest stopped by user")
finally:
    # Clean up GPIO on exit
    GPIO.cleanup()
    print("GPIO cleaned up")
