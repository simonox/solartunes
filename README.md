# SolarTunes

A sustainable sound player for Raspberry Pi with SolarPunk aesthetics. Built with Next.js and designed for eco-friendly, solar-powered setups.

## 🌱 Features

- **🎵 Sound Library**: Browse and play .wav files from your Music directory
- **🎮 Simple Controls**: Click to play/stop with single-file playback protection
- **🎯 Motion Detection**: PIR sensor integration for automatic sound triggering
- **📊 System Monitoring**: Real-time system logs for debugging
- **🌿 SolarPunk Design**: Beautiful green gradients and nature-inspired UI (not really, just green color)
- **⚡ Low Power**: Optimized for solar-powered Raspberry Pi setups
- **🔄 Auto-Start**: Systemd service for automatic startup on boot
- **📱 File Upload**: Upload and process WAV files directly through the web interface
- **🛡️ SD Card Protection**: Advanced read-only mode for SD card longevity [ ] untested

## 🎬 Preview

<img width="764" alt="screenshot" src="https://github.com/user-attachments/assets/821008a9-afb6-4d05-82b9-2d741c8e4eab" />


## 🚀 Quick Setup

### 1. Clone the Repository

```bash
mkdir ~/solartunes
cd ~/solartunes
git clone https://github.com/simonox/solartunes.git .
```

### 2. Run the Setup Script

```bash
chmod +x scripts/setup-raspberry-pi.sh
./scripts/setup-raspberry-pi.sh
```

### 3. Deploy the Project

```bash
chmod +x scripts/deploy-project.sh
./scripts/deploy-project.sh
```

### 4. Start the Service

```bash
sudo systemctl start solartunes
```

### 5. Setup Motion Detection (Optional)

```bash
chmod +x scripts/setup-motion-sensor.sh
./scripts/setup-motion-sensor.sh
```

## 🔧 What the Setup Script Does

- ✅ **System Updates**: Updates all packages to latest versions
- ✅ **Audio Setup**: Installs ALSA and audio tools (aplay, pulseaudio)
- ✅ **Node.js 20**: Installs latest LTS version via NodeSource
- ✅ **pnpm**: Installs fast, disk space efficient package manager
- ✅ **Audio Config**: Sets up audio permissions and ALSA configuration
- ✅ **Systemd Service**: Creates auto-start service for boot
- ✅ **Log Rotation**: Manages log files to prevent disk overflow
- ✅ **Test Files**: Creates sample .wav files for testing
- ✅ **Helper Scripts**: Management utilities for easy control

## 🎛️ Service Management

Use these commands to control your SolarTunes service:

```bash
# Start the service
sudo systemctl start solartunes

# Stop the service
sudo systemctl stop solartunes

# Restart the service
sudo systemctl restart solartunes

# Check status
sudo systemctl status solartunes

# View real-time logs
sudo journalctl -u solartunes -f

# Enable auto-start on boot
sudo systemctl enable solartunes

# Disable auto-start
sudo systemctl disable solartunes
```

## 📁 Project Structure

```
~/solartunes/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── files/         # List .wav files
│   │   ├── play/          # Play audio files
│   │   ├── stop/          # Stop playback
│   │   ├── status/        # Check playback status
│   │   ├── logs/          # System logs
│   │   ├── motion/        # Motion detection API
│   │   ├── upload/        # File upload handling
│   │   ├── volume/        # Volume control
│   │   ├── temperature/   # System temperature
│   │   ├── cleanup/       # Audio cleanup utilities
│   │   └── sdcard/        # SD card status and management
│   ├── layout.tsx         # App layout
│   └── page.tsx           # Main sound player interface
├── scripts/               # Setup and management scripts
│   ├── setup-raspberry-pi.sh
│   ├── deploy-project.sh
│   ├── setup-motion-sensor.sh
│   ├── motion-detector.py
│   ├── test-pir.py
│   └── [management scripts]
└── README.md
```

## 📜 Shell Scripts Reference

### Setup Scripts

#### `setup-raspberry-pi.sh`
**Purpose**: Complete Raspberry Pi environment setup for SolarTunes
- Updates system packages
- Installs audio dependencies (ALSA, PulseAudio)
- Installs Node.js 20 and pnpm
- Configures audio permissions and ALSA
- Creates systemd service
- Sets up log rotation
- Creates test audio files
- Generates helper scripts

#### `deploy-project.sh`
**Purpose**: Deploys the Next.js project to Raspberry Pi
- Creates package.json with dependencies
- Configures Next.js and Tailwind
- Installs npm dependencies
- Builds the production application

#### `setup-motion-sensor.sh`
**Purpose**: Sets up PIR motion sensor integration
- Installs Python GPIO libraries
- Creates motion detection script
- Sets up systemd service for motion detection
- Provides hardware wiring guide
- Creates test and management scripts

### Service Management Scripts

#### `start-solartunes.sh`
**Purpose**: Starts the SolarTunes service
- Uses systemd if available
- Falls back to manual start in development
- Displays service status and access URL

#### `stop-solartunes.sh`
**Purpose**: Stops the SolarTunes service
- Gracefully stops systemd service
- Kills Node.js processes if systemd unavailable
- Stops any audio playback

#### `restart-solartunes.sh`
**Purpose**: Restarts the SolarTunes service
- Stops and starts the service
- Shows recent logs
- Displays access information

#### `status-solartunes.sh`
**Purpose**: Shows comprehensive system status
- Service status and logs
- Network and port information
- Audio device status
- System resources (memory, disk, temperature)
- Power status and throttling info

#### `update-project.sh`
**Purpose**: Updates SolarTunes to latest version
- Pulls latest code from Git
- Updates dependencies
- Rebuilds the project
- Restarts services

### Motion Detection Scripts

#### `start-motion-detector.sh`
**Purpose**: Starts the motion detection service
- Starts systemd service or manual process
- Verifies successful startup

#### `stop-motion-detector.sh`
**Purpose**: Stops the motion detection service
- Stops systemd service gracefully
- Kills motion detector processes

#### `status-motion-detector.sh`
**Purpose**: Shows motion detection status
- Service status and logs
- Recent motion detection events
- Process information

#### `motion-detector.py`
**Purpose**: Main motion detection daemon
- Monitors PIR sensor on GPIO5
- Calls SolarTunes API when motion detected
- Includes cooldown period and logging
- Handles GPIO cleanup

### Testing Scripts

#### `test-pir.py`
**Purpose**: Simple PIR sensor test
- Basic GPIO5 motion detection
- Minimal script for hardware verification
- Real-time motion status display

#### `test-pir-updated.py`
**Purpose**: Advanced PIR sensor test with error handling
- Comprehensive GPIO testing
- Version information display
- Better error handling and diagnostics

#### `test-pir-gpiozero.py`
**Purpose**: PIR testing using gpiozero library
- Alternative to RPi.GPIO
- Better compatibility with newer Pi models
- Simplified motion detection API

#### `gpio-diagnostic.py`
**Purpose**: Comprehensive GPIO system diagnostics
- Tests multiple GPIO libraries
- Checks Raspberry Pi model compatibility
- Provides troubleshooting recommendations

#### `test-motion-sensor.sh`
**Purpose**: Motion sensor integration test
- Tests Python script functionality
- Checks API endpoints
- Verifies service status
- Shows recent logs

#### `test-motion-integration.sh`
**Purpose**: Full motion detection integration test
- Verifies SolarTunes is running
- Tests API connectivity
- Runs motion detector for testing period

#### `test-audio.sh`
**Purpose**: Audio system testing and diagnostics
- Lists audio devices and controls
- Tests various aplay configurations
- Provides audio troubleshooting recommendations

#### `test-hifiberry.sh`
**Purpose**: Specific testing for HiFiBerry DAC+ audio HAT
- Tests HiFiBerry driver loading
- Checks DAC-specific controls
- Tests various audio formats
- Provides HiFiBerry-specific recommendations

### Utility Scripts

#### `install-gpio-libraries.sh`
**Purpose**: Installs and updates GPIO libraries
- Installs RPi.GPIO, gpiozero, and pigpio
- Verifies successful installation
- Starts pigpio daemon

#### `fix-motion-setup.sh`
**Purpose**: Emergency motion detection fix
- Creates simplified motion detector
- Provides basic functionality when main setup fails

#### `update-motion-gpio.sh`
**Purpose**: Updates motion detection to use different GPIO pin
- Changes GPIO pin configuration
- Updates all related scripts
- Provides new wiring instructions

#### `test-gpio5.sh`
**Purpose**: Specific testing for GPIO5 pin
- Tests GPIO5 pin access and functionality
- Checks for GPIO conflicts
- Verifies motion detector script

#### `setup-working-motion.sh`
**Purpose**: Sets up production motion detection
- Creates production motion detector based on working test
- Configures systemd service
- Provides integration testing

#### `start-motion-production.sh`
**Purpose**: Starts complete SolarTunes system with motion detection
- Starts both SolarTunes and motion detection services
- Verifies both services are running
- Provides status and next steps

#### `make-scripts-executable.sh`
**Purpose**: Makes all scripts executable
- Sets execute permissions on all shell and Python scripts
- Lists all available scripts

#### `manage-autoplay-config.sh`
**Purpose**: Manages motion detection configuration
- Shows current autoplay configuration
- Sets motion trigger files
- Enables/disables motion detection
- Backs up and restores configuration

### SD Card Protection Scripts

#### `setup-sdcard-protection.sh`
**Purpose**: Sets up SD card write protection system
- Creates mount wrapper scripts
- Sets up sudoers rules for mount operations
- Creates SD card management utilities
- Configures automatic protection on shutdown

#### `setup-ramdisk.sh`
**Purpose**: Sets up RAM disk for logs when SD card is locked
- Creates RAM disk directories
- Configures systemd tmpfiles
- Sets up log rotation for RAM disk
- Updates services to use RAM disk when needed

#### `restore-readwrite.sh`
**Purpose**: Restores system to normal read-write mode
- Undoes changes made by read-only boot configuration
- Disables read-only boot service
- Restores normal SolarTunes operation
- Re-enables system logging services

#### `reboot-to-readonly.sh`
**Purpose**: Configures system to boot directly into read-only mode
- Creates systemd service for read-only boot
- Updates SolarTunes service for RAM disk operation
- Disables disk-writing services
- Provides automatic read-only protection

#### `check-readonly-status.sh`
**Purpose**: Checks current filesystem status and read-only configuration
- Shows current mount status (read-only vs read-write)
- Checks read-only boot service configuration
- Displays SolarTunes service status
- Shows RAM disk usage
- Provides quick action commands

#### `quick-sdcard-fix.sh`
**Purpose**: Simple approach to fix common SD card locking issues
- Tries basic fixes for filesystem locking
- Stops interfering services
- Provides quick diagnosis of busy processes
- Offers next steps if simple fixes fail

#### `force-readonly.sh`
**Purpose**: Aggressively forces SD card into read-only mode
- Stops all user services and processes
- Kills processes that might prevent locking
- Uses multiple sync and cache clearing attempts
- Last resort before emergency methods

#### `emergency-sdcard-lock.sh`
**Purpose**: Emergency SD card protection using extreme measures
- Identifies processes keeping filesystem busy
- Aggressively stops services and processes
- Uses multiple remount strategies
- Provides comprehensive status and diagnostics

#### `diagnose-sdcard-issues.sh`
**Purpose**: Comprehensive SD card diagnostics
- Analyzes filesystem activity and open files
- Checks for hardware write protection
- Identifies services that might interfere
- Provides detailed recommendations

### System Diagnostics and Repair Scripts

#### `diagnose-startup-issue.sh`
**Purpose**: Comprehensive diagnostic for SolarTunes startup problems
- Checks environment and project structure
- Analyzes package.json and dependencies
- Tests manual startup
- Reviews service logs and system resources
- Provides step-by-step troubleshooting recommendations

#### `rebuild-project.sh`
**Purpose**: Complete project rebuild from scratch
- Cleans old build artifacts
- Creates fresh configuration files
- Reinstalls all dependencies
- Rebuilds the project
- Tests manual and service startup

#### `simple-start-test.sh`
**Purpose**: Simple manual startup test
- Tests if SolarTunes can start without systemd
- Kills conflicting processes
- Sets proper environment variables
- Uses available package manager

#### `fix-systemd-service.sh`
**Purpose**: Fixes systemd service configuration for proper daemon operation
- Creates improved service configuration
- Handles package manager detection
- Sets up proper restart and logging
- Creates monitoring and management tools

## 🔌 PIR Motion Sensor Wiring

### Photo

![wiring](https://github.com/user-attachments/assets/3e9a0fef-aa41-4b92-96b0-9c75816b41b9)

### Video



https://github.com/user-attachments/assets/ed1aca57-9e36-4d69-b596-c51ba345ed4f



### Hardware Requirements
- PIR Motion Sensor (HC-SR501 recommended)
- 3 Female-to-Female jumper wires
- Raspberry Pi with GPIO pins

### Wiring Diagram

```
PIR Sensor          Raspberry Pi
┌─────────────┐    ┌────────────────-─┐
│             │    │                  │
│    VCC   ●──┼────┼──● Pin 2 (5V)    │ (or any other 5V output, see photo!)
│             │    │   or Pin 1(3.3V) │
│    OUT   ●──┼────┼──● Pin 29(GPIO5) │
│             │    │                  │
│    GND   ●──┼────┼──● Pin 6 (GND)   │ (or any other GND input, see photo!)
│             │    │                  │
└─────────────┘    └─────────────────-┘
```

### Pin Layout Reference

```
Connection Points:
• Pin 2 (5V) or Pin 1 (3.3V) → PIR VCC
• Pin 29 (GPIO5) → PIR OUT  ← Motion detection pin
• Pin 6 (GND) → PIR GND
```

### PIR Sensor Adjustment

Most PIR sensors have two potentiometers for adjustment:

```
PIR Sensor Top View
┌─────────────────┐
│  ┌───┐    ┌───┐ │
│  │ S │    │ T │ │  S = Sensitivity (detection range)
│  └───┘    └───┘ │  T = Time delay (output duration)
│                 │
│    [Dome]       │
│                 │
│ VCC  OUT   GND  │
└─────────────────┘
```

**Adjustment Tips:**
- **Sensitivity (S)**: Turn clockwise to increase detection range (3-7 meters)
- **Time Delay (T)**: Turn clockwise to increase output duration (5 seconds - 5 minutes)
- Use a small screwdriver for adjustments
- Test after each adjustment

## 🎵 Adding Your Own Sound Files

1. Copy your .wav files to the Music directory:
   ```bash
   cp your-sounds/*.wav ~/Music/
   ```

2. Or use the web interface upload feature:
   - Click "Upload WAV File" in the web interface
   - Select your .wav file
   - Files are automatically processed for compatibility

3. Your new files will appear in the Sound Library!

### 💩 WAV Files That Don't Work

Not all wav formats are supported, you can convert them using ffmpeg:

```bash
ffmpeg -i ~/Music/Testaudio_LR_getrennt.wav -acodec pcm_s16le -ac 2 -ar 44100 fixed.wav
```
This conversion is already done if the wav file is uploaded with the web UI.

## 🎯 Motion Detection Configuration

SolarTunes automatically saves your motion detection settings to `~/Music/autoplay.conf`. When the app starts, it will:

- ✅ **Restore Selected File**: Automatically select the previously configured motion trigger file
- ✅ **Auto-Enable Motion**: Activate motion detection if a file was previously selected
- ✅ **Persist Settings**: Save any changes to motion settings automatically

### Configuration File Format

The `~/Music/autoplay.conf` file uses JSON format:

```json
{
  "enabled": true,
  "selectedFile": "your-sound-file.wav",
  "lastSaved": "2025-01-07T15:30:00.000Z"
}
```

### Managing Configuration

Use the configuration management script for advanced control:

```bash
# Show current configuration
./scripts/manage-autoplay-config.sh show

# Set a specific file for motion triggering
./scripts/manage-autoplay-config.sh set your-file.wav

# Enable/disable motion detection
./scripts/manage-autoplay-config.sh toggle

# Backup current configuration
./scripts/manage-autoplay-config.sh backup

# Interactive menu
./scripts/manage-autoplay-config.sh
```

### Manual Configuration

You can also manually edit the configuration file:

```bash
# Edit configuration directly
nano ~/Music/autoplay.conf

# Restart SolarTunes to apply changes
sudo systemctl restart solartunes
```

## 🛡️ SD Card Protection

SolarTunes includes advanced SD card protection features to extend the life of your SD card by reducing write operations.

### Quick Commands

```bash
# Check current status
./scripts/check-readonly-status.sh

# Quick fix for common issues
./scripts/quick-sdcard-fix.sh

# Force read-only mode
./scripts/force-readonly.sh

# Emergency protection (aggressive)
./scripts/emergency-sdcard-lock.sh

# Restore to normal mode
sudo ./scripts/restore-readwrite.sh

# Configure boot-time protection
sudo ./scripts/reboot-to-readonly.sh
```

### Protection Levels

1. **Manual Protection**: Use `force-readonly.sh` for immediate protection
2. **Emergency Protection**: Use `emergency-sdcard-lock.sh` when normal methods fail
3. **Boot Protection**: Use `reboot-to-readonly.sh` for automatic protection on startup
4. **RAM Disk Mode**: Automatically uses RAM for logs when SD card is protected

### How It Works

- **Read-Only Filesystem**: Prevents all writes to the SD card
- **RAM Disk**: Stores logs and temporary files in memory
- **Service Management**: Automatically restarts services with RAM disk configuration
- **Hardware Detection**: Detects and respects hardware write protection switches

### Important Notes

- ⚠️ **Unlock before uploads**: File uploads require the SD card to be writable
- ⚠️ **RAM limitations**: RAM disk is limited by available system memory
- ⚠️ **Data loss**: RAM disk data is lost on reboot
- ⚠️ **Emergency use**: Use emergency scripts only when normal methods fail

## 🌐 Access Your Sound Player

After setup, your SolarTunes player will be available at:

**Local Access:** `http://localhost:3000`

**Network Access:** `http://[your-pi-ip]:3000`

**Custom Domain:** `http://solartunes.local:3000` (if mDNS configured)

To find your Pi's IP address:
```bash
hostname -I
```

## 🔧 Troubleshooting

### Service Won't Start

```bash
# Check service status
sudo systemctl status solartunes

# Check logs for errors
sudo journalctl -u solartunes -n 50

# Restart the service
sudo systemctl restart solartunes

# Run comprehensive diagnostics
./scripts/diagnose-startup-issue.sh

# Complete rebuild if needed
./scripts/rebuild-project.sh
```

### No Audio Output

```bash
# List audio devices
aplay -l

# Test audio with a file
aplay ~/Music/test-tone.wav

# Check audio groups
groups $USER

# Test volume control
amixer -c 0 sset 'Digital' 50%

# Run audio diagnostics
./scripts/test-audio.sh

# Test HiFiBerry DAC+ (if applicable)
./scripts/test-hifiberry.sh
```

### Motion Detection Issues

```bash
# Test PIR sensor hardware
python3 scripts/test-pir.py

# Check motion detector service
sudo systemctl status motion-detector

# View motion logs
tail -f /tmp/motion-detector.log

# Test API endpoint
curl -X POST http://localhost:3000/api/motion \
     -H "Content-Type: application/json" \
     -d '{"action": "triggerMotion"}'

# Run GPIO diagnostics
python3 scripts/gpio-diagnostic.py

# Install/update GPIO libraries
./scripts/install-gpio-libraries.sh
```

### Web Interface Not Loading

```bash
# Check if port 3000 is in use
sudo netstat -tlnp | grep :3000

# Check firewall settings
sudo ufw status

# Restart networking
sudo systemctl restart networking
```

### SD Card Protection Issues

```bash
# Check current status
./scripts/check-readonly-status.sh

# Diagnose SD card issues
./scripts/diagnose-sdcard-issues.sh

# Try quick fix
./scripts/quick-sdcard-fix.sh

# Force protection if needed
./scripts/force-readonly.sh

# Emergency protection
./scripts/emergency-sdcard-lock.sh

# Restore normal operation
sudo ./scripts/restore-readwrite.sh
```

## 🔄 Updating SolarTunes

To update your installation:

```bash
cd ~/solartunes/
./scripts/update-project.sh
```

## ⚡ Solar Power Optimization

For solar-powered setups:

1. **Monitor Power Usage:**
   ```bash
   # Check system load
   htop
   
   # Monitor power consumption
   vcgencmd measure_temp
   vcgencmd get_throttled
   ```

2. **Optimize Performance:**
   - Use efficient .wav files (lower bitrates for longer playback)
   - Enable auto-shutdown during low battery
   - Schedule playback during peak solar hours

3. **Battery Management:**
   - [ ] Monitor battery voltage in system logs → I have no idea how to do this, as we just have a usual battery.
   - [ ] Set up low-power mode triggers → Same, we don't know how much power is in the battery.
   - [ ] Use the sensor (movement and illumination) to detect night and day, when there is no light, put the Pi in power safe mode. Also, the PIR does not deliver illumnation, just movement, so we have to add also an illumination sensor for that. 🤷‍♂️

4. **To Dos**
   - ✅ upload wav files
   - ✅ install sensor (movement and illumination)
   - ✅ lock SD Card in read only-mode
   - ✅ unlock SD Card for uploading
   - ✅ move log files to RAM disk (as SD Card is locked)

## 🛠️ Setup Access Point

### Step-by-Step Setup (No Internet Hotspot)

1. **Update Raspberry Pi**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install Access Point and DHCP Tools**
   ```bash
   sudo apt install hostapd dnsmasq
   sudo systemctl unmask hostapd
   sudo systemctl enable hostapd
   ```

3. **Assign Static IP to wlan0**
   ```bash
   sudo nano /etc/dhcpcd.conf
   ```
   Append:
   ```
   interface wlan0
       static ip_address=192.168.4.1/24
       nohook wpa_supplicant
   ```
   ```bash
   sudo service dhcpcd restart
   ```

4. **Configure dnsmasq (DHCP Server)**
   ```bash
   sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.orig
   sudo nano /etc/dnsmasq.conf
   ```
   Add:
   ```
   interface=wlan0
   dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h
   ```

5. **Configure hostapd (Wi-Fi Hotspot)**
   ```bash
   sudo nano /etc/hostapd/hostapd.conf
   ```
   Example:
   ```
   interface=wlan0
   driver=nl80211
   ssid=MyPiAP
   hw_mode=g
   channel=7
   wmm_enabled=0
   macaddr_acl=0
   auth_algs=1
   ignore_broadcast_ssid=0
   wpa=2
   wpa_passphrase=raspberry123
   wpa_key_mgmt=WPA-PSK
   rsn_pairwise=CCMP
   ```
   ```bash
   sudo nano /etc/default/hostapd
   ```
   Add or update:
   ```
   DAEMON_CONF="/etc/hostapd/hostapd.conf"
   ```

6. **Start Services**
   ```bash
   sudo systemctl start hostapd
   sudo systemctl start dnsmasq
   sudo systemctl enable hostapd
   sudo systemctl enable dnsmasq
   ```

### Final Result
- The Pi creates a Wi-Fi network called MyPiAP
- Devices connecting get an IP (e.g., 192.168.4.2)
- Your Node.js app is available at: `http://192.168.4.1:3000`

### Enable solartunes.local Using avahi-daemon

1. **Install avahi-daemon**
   ```bash
   sudo apt install avahi-daemon
   ```

2. **Set the Hostname**
   ```bash
   sudo raspi-config
   ```
   Choose: System Options → Hostname → Enter: solartunes
   
   Or manually:
   ```bash
   echo "solartunes" | sudo tee /etc/hostname
   sudo sed -i 's/127.0.1.1.*/127.0.1.1 solartunes/' /etc/hosts
   sudo reboot
   ```

Now access via: `http://solartunes.local:3000`

# 🔋 Smart Battery-Powered Raspberry Pi with ESP-based Power Management

This project uses an ESP8266 or ESP32 to monitor battery voltage and automatically control the power state of a Raspberry Pi. It enables clean shutdowns when the battery is low and reboots the Pi when the battery is recharged.

## 🧹 Components

* Raspberry Pi (any model)
* ESP8266 or ESP32
* Lithium battery (with protection circuit or BMS)
* Voltage divider (resistors)
* P-Channel MOSFET or relay
* Optional: RTC or deep sleep logic for ESP

## ⚙️ How It Works

1. **Monitor Battery Voltage**
   The ESP reads battery voltage via an analog input and a voltage divider. Thresholds are set to determine when to shut down or power on the Pi.

2. **Shutdown Signal to Raspberry Pi**
   If battery voltage drops below a `LOW_THRESHOLD`, the ESP sends a shutdown signal to the Pi:

   * **Option A (GPIO):** Pull an ESP GPIO pin connected to a Pi GPIO. A daemon on the Pi listens and runs `sudo shutdown now`.
   * **Option B (Wi-Fi):** ESP sends a shutdown command via HTTP or MQTT to the Pi.

3. **Power Off the Pi**
   After confirming shutdown (e.g., 30-second delay), the ESP cuts power to the Pi using a **P-Channel MOSFET** or **relay**.

4. **Reboot When Battery is Charged**
   Once battery voltage exceeds a `HIGH_THRESHOLD`, the ESP reconnects power to the Pi, which then auto-boots.

---

## 🧠 Logic Summary

```text
IF battery voltage < LOW_THRESHOLD:
    Signal Pi to shutdown
    Wait 30s
    Cut power to Pi

ELSE IF battery voltage > HIGH_THRESHOLD:
    Restore power to Pi
```

---

## 🔌 Circuit Overview

* **Voltage Divider:** Reduces battery voltage to ESP-safe levels (max 3.3V).
* **MOSFET:** Controls power line between battery and Pi.
* **ESP GPIO → Pi GPIO:** (Optional) For shutdown signaling.

---

## 🗅️ Pi Shutdown Script (GPIO Example)

Create a script on the Pi to listen for shutdown signal:

```bash
#!/bin/bash

GPIO=17
echo "$GPIO" > /sys/class/gpio/export
echo "in" > /sys/class/gpio/gpio$GPIO/direction

while true; do
  if [ "$(cat /sys/class/gpio/gpio$GPIO/value)" -eq 0 ]; then
    sudo shutdown now
    break
  fi
  sleep 1
done
```

---

## 🦪 ESP Sample Code (ESP8266/ESP32)

```cpp
const int analogPin = A0; // Or GPIO 34 for ESP32
const float R1 = 10000.0; // Voltage divider resistor 1 (top)
const float R2 = 10000.0; // Resistor 2 (bottom)
const float LOW_THRESHOLD = 3.3;
const float HIGH_THRESHOLD = 3.7;
const int powerControlPin = 5; // Controls MOSFET

void setup() {
  pinMode(powerControlPin, OUTPUT);
  digitalWrite(powerControlPin, HIGH); // Assume HIGH = Pi ON
}

void loop() {
  float voltage = analogRead(analogPin) / 1023.0 * 3.3 * (R1 + R2) / R2;

  if (voltage < LOW_THRESHOLD) {
    signalPiShutdown();
    delay(30000); // Wait for Pi to shut down
    digitalWrite(powerControlPin, LOW); // Cut power
  } else if (voltage > HIGH_THRESHOLD) {
    digitalWrite(powerControlPin, HIGH); // Power on
  }

  delay(10000); // Check every 10 seconds
}

void signalPiShutdown() {
  // Optionally use GPIO or send HTTP/MQTT command
}
```

---

## ⚠️ Notes

* Ensure the Raspberry Pi is configured to **boot on power restore**.
* Use a MOSFET with sufficient current rating.
* ESP can use **deep sleep** to conserve power when idle.

---

## 📦 To-Do

* [ ] Add circuit diagrams
* [ ] Add HTTP/MQTT shutdown example
* [ ] Add support for multiple ESPs in mesh mode (optional)


## 🌿 SolarPunk Philosophy

SolarTunes embodies SolarPunk principles:

- **Sustainability**: Designed for renewable energy systems
- **Accessibility**: Simple, intuitive interface for all users  
- **Community**: Open source and hackable
- **Resilience**: Works offline and in low-power scenarios

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on a Raspberry Pi
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

Copyright (c) 2025 CCL

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## 🆘 Support

- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join community discussions
- **Documentation**: Check the wiki for detailed guides
- **Community**: Connect with other SolarPunk makers

---

**Made with 🌱 for a sustainable future**
