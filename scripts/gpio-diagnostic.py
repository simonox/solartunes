#!/usr/bin/env python3
"""
Raspberry Pi GPIO Diagnostic Tool
Tests GPIO configuration and PIR sensor on GPIO5
"""
import os
import sys
import time
import subprocess

print("🔍 Raspberry Pi GPIO Diagnostic Tool")
print("===================================")

# Check Python version
print(f"Python version: {sys.version}")

# Check if running on Raspberry Pi
def is_raspberry_pi():
    try:
        with open('/proc/cpuinfo', 'r') as f:
            cpuinfo = f.read()
        return 'Raspberry Pi' in cpuinfo or 'BCM' in cpuinfo or 'Broadcom' in cpuinfo
    except:
        return False

print(f"Running on Raspberry Pi: {is_raspberry_pi()}")

# Check for RPi.GPIO
try:
    import RPi.GPIO as GPIO
    print(f"RPi.GPIO version: {GPIO.VERSION}")
    gpio_available = True
except ImportError:
    print("❌ RPi.GPIO not installed")
    gpio_available = False
except Exception as e:
    print(f"❌ Error importing RPi.GPIO: {e}")
    gpio_available = False

# Check for gpiozero (alternative library)
try:
    import gpiozero
    print(f"gpiozero version: {gpiozero.__version__}")
    gpiozero_available = True
except ImportError:
    print("gpiozero not installed")
    gpiozero_available = False
except Exception as e:
    print(f"Error importing gpiozero: {e}")
    gpiozero_available = False

# Check Raspberry Pi model
try:
    model = subprocess.check_output(['cat', '/proc/device-tree/model'], 
                                   universal_newlines=True).strip()
    print(f"Raspberry Pi model: {model}")
except:
    print("Could not determine Raspberry Pi model")

# Check GPIO pin 5 status using both libraries if available
print("\n📊 Testing GPIO5 (Pin 29):")

if gpio_available:
    try:
        print("\nTesting with RPi.GPIO:")
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(5, GPIO.IN)
        value = GPIO.input(5)
        print(f"GPIO5 current value: {value}")
        GPIO.cleanup()
    except Exception as e:
        print(f"❌ RPi.GPIO test failed: {e}")

if gpiozero_available:
    try:
        print("\nTesting with gpiozero:")
        from gpiozero import InputDevice
        pin = InputDevice(5)
        value = pin.value
        print(f"GPIO5 current value: {value}")
        pin.close()
    except Exception as e:
        print(f"❌ gpiozero test failed: {e}")

# Suggest solutions
print("\n🔧 Recommendations:")
if not gpio_available:
    print("1. Install or update RPi.GPIO: sudo apt-get update && sudo apt-get install python3-rpi.gpio")
elif not is_raspberry_pi():
    print("1. This script must be run on a Raspberry Pi")
else:
    print("1. Try using the gpiozero library instead: sudo apt-get install python3-gpiozero")
    print("2. Update your Raspberry Pi: sudo apt-get update && sudo apt-get upgrade")
    print("3. Check your wiring - ensure the PIR sensor is connected to GPIO5 (Pin 29)")

print("\nDiagnostic complete!")
