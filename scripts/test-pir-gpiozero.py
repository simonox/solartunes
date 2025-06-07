#!/usr/bin/env python3
"""
PIR motion sensor test using gpiozero library
This is an alternative to RPi.GPIO that works better on newer Pi models
"""
import time
import sys

try:
    from gpiozero import MotionSensor
    print("gpiozero library loaded successfully")
except ImportError:
    print("gpiozero library not found. Installing...")
    import subprocess
    subprocess.call(['sudo', 'apt-get', 'update'])
    subprocess.call(['sudo', 'apt-get', 'install', '-y', 'python3-gpiozero'])
    from gpiozero import MotionSensor

# Create a motion sensor object connected to GPIO5
pir = MotionSensor(5)

print("PIR Motion Sensor Test (GPIO5) using gpiozero")
print("--------------------------------------------")
print("Press CTRL+C to exit")
print("Waiting for sensor to settle (5 sec)...")

# Give the sensor time to settle
time.sleep(5)
print("Ready! Watching for motion...")

motion_count = 0

try:
    while True:
        # Wait for motion
        pir.wait_for_motion()
        motion_count += 1
        print(f"🔍 Motion Detected! (Count: {motion_count})")
        
        # Wait for no motion before detecting again
        pir.wait_for_no_motion()
        print("Motion stopped")

except KeyboardInterrupt:
    print("\nTest stopped by user")
    # gpiozero automatically cleans up on exit
