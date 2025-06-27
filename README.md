# SolarTunes

A sustainable sound player for Raspberry Pi with SolarPunk aesthetics. You can upload tracks and play them. It can even start a selected track on motion detection. Services are started on startup. Events are logged with logd. Aplay is used for playback. Node.js ist the runtime environment. Typescript, Bash and Python are the languages used to build it. PNPM ist used as a package manger. Tailwind.CSS ist used for layout, widgets and as a design system. Frontend and backend is built with Next.js and designed for eco-friendly, solar-powered setups.


## 🚜 Hardware
- 🍓 RaspberryPi 4
- 🎸 HiFiBerry Amp2 (Class-D, 2×30 W RMS)
- 🔉 JBL Control 1 speakers
- 🔋 Pb accumulator AGWI Standard 12LS-7.2(F1)
- ☀️ Solar Panel
- ⚡️ MPPT charging regulator
- 🏎️ PIR Sensor
- 💾 MicroSD Card (64 GB)


## 🌱 Features

- **🎵 Sound Library**: Browse and play .wav files from your Music directory
- **🎮 Simple Controls**: Click to play/stop with single-file playback protection
- **🎯 Motion Detection**: PIR sensor integration for automatic sound triggering and executing self-hackable scripts
- **📊 System Monitoring**: Real-time system logs for debugging
- **🌿 SolarPunk Design**: Beautiful green gradients and nature-inspired UI (not really, just green color)
- **⚡ Low Power**: Optimized for solar-powered Raspberry Pi setups
- **🔄 Auto-Start**: Systemd service for automatic startup on boot
- **📱 File Upload**: Upload and process WAV files directly through the web interface
- **🛡️ TODO: SD Card Protection**: Advanced read-only mode for SD card longevity [not working very stable]

## 🎬 Preview

<img width="764" alt="screenshot" src="https://github.com/user-attachments/assets/821008a9-afb6-4d05-82b9-2d741c8e4eab" />

## 🎨 Diagrams

![diagram](https://github.com/user-attachments/assets/79366939-6b02-4e4d-816a-509ed3e46fe2)

> Source: [umldiagram.puml](umldiagram.puml), created using [PlantUML](https://editor.plantuml.com/)

![diagram](https://github.com/user-attachments/assets/c426fe72-6385-45e9-bca0-353293f425b7)


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


# 🔧 What the Setup Script Does

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


## 🔌 PIR Motion Sensor Wiring

To auto-start a track when motion is detected, we have to add a PIR sensor to SolarTunes.

> Passive Infrared Sensor (PIR sensor) is an electronic sensor that measures infrared (IR) light radiating from objects in its field of view. They are most often used in PIR-based motion detectors. PIR sensors are commonly used in security alarms and automatic lighting applications. -- https://en.wikipedia.org/wiki/Passive_infrared_sensor

### Photo

![wiring](https://github.com/user-attachments/assets/73bb33f6-f3f4-491c-9e59-97fa4ed3fdc3)

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
   - Click "Upload WAV File" in the web interface (or use drag'n' drop on most modern web browsers)
   - Select your .wav file (already done when using drag'n'drop)
   - Files are automatically processed for compatibility
   - ⚠️ There is a 30 seconds timeout. Large files (like 300 MB) may not be processed in that time. Use an SFTP (FTP over SSH) Client (like Cypberduck) to upload big files. Make sure that they are 16bit PCM WAV files.

3. Your new files will appear in the Sound Library!

### 💩 WAV Files That Don't Work

Not all wav formats are supported, you can convert them using ffmpeg:

```bash
ffmpeg -i ~/Music/Testaudio_LR_getrennt.wav -acodec pcm_s16le -ac 2 -ar 44100 fixed.wav
```
This conversion is already done if the wav file is uploaded with the web UI.

## 🎯 Motion Detection Playback Configuration

SolarTunes plays a *selected* track if a motion is detected. If there is already a track playing, it will not interrupt the playback, but create a log entry. The selected track should survive a re-boot of the system. So a configuration file is stored next to your Tracks in the `~/Music` directory.

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

SolarTunes takes care of the configuration if you are using the UI. If you want to do it on the command line: Use the configuration management script for advanced control:

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

### Motion Hook

 You can also execute a script on Motion Detection.

 Key features are:
 1. **Persistent Storage**: Configuration saved to `webhook.conf` file
 2. **Motion Trigger**: Commands execute when motion detection is triggered
 4. **TimeOut**: Commands timeout after 30 seconds


 #### Usage Examples

* 🛡️ Only scripts from ~/Music directory are available
* ⏰ Scripts execute with 30-second timeout
* 🎵 Working directory is set to ~/Music
* 🛑 Select "No script" to disable webhook
 
 The webhook executes alongside the existing motion detection functionality without affecting any other components.


 #### Configuration File Format

 The `~/Music/webhook.conf` file uses JSON format:

 ```json
 {
   "command": "/home/pi/Music/blink.sh",
   "lastSaved": "2025-06-08T21:04:43.871Z"
 }
 ```
#### Diagram for Motion Detection

![image](https://github.com/user-attachments/assets/e2fd2b45-e08d-4412-a30b-f8c538e0e648)

> Source: [motion.hook.puml](motion.hook.puml) created using 🌱 PlantUML

## 🛡️ TODO / UNTESTED: SD Card Protection

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


## 📜 Shell Scripts Reference

> Note: Most scripts were written during development. As during development a lot did change (and not everything worked out as planned, the usual way software development works) some scripts are outdate and may not even work. Sure... a clean up should be on the TODO list.

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


# 🛠️ Step-by-Step Setup to create a Wifi HotSpot

Create a Wi-Fi Access Point named **`solartunes`** with password **`********`** that:

- Shares internet from Ethernet if connected
- Serves local apps (like Node.js on port 3000) if no Ethernet
- Uses NetworkManager and nmcli only (no hostapd/dnsmasq/dhcpcd)


## Prerequisites

- Raspberry Pi OS with NetworkManager installed and running
- `nmcli` CLI tool available
- Node.js app or other local services listening on `0.0.0.0:3000`


## Step 0: Verify connections

Verify remaining connections:

```bash
nmcli connection show
```

should give you

```bash
Wired connection 1  c61e9bfe-c634-3354-95bd-d257f7800b6c  ethernet  eth0
MyPrivateWLAN       edaf8d6e-29cd-4c51-83eb-806e50547623  wifi      wlan0
lo                  0a78e945-7563-4f93-a852-6fde5fa167d6  loopback  lo
preconfigured       72a7caee-a05e-4145-9560-6768ab9da58d  wifi      --
```

## Step 1: Create the Wi-Fi Access Point

Create a new Wi-Fi AP connection with SSID solartunes and password ********:

```bash
sudo nmcli connection add type wifi ifname wlan0 con-name solartunes ssid solartunes
sudo nmcli connection modify solartunes mode ap
sudo nmcli connection modify solartunes 802-11-wireless.band bg
sudo nmcli connection modify solartunes 802-11-wireless.channel 6
sudo nmcli connection modify solartunes wifi-sec.key-mgmt wpa-psk
sudo nmcli connection modify solartunes wifi-sec.psk "**********"
sudo nmcli connection modify solartunes ipv4.addresses 192.168.4.1/24
sudo nmcli connection modify solartunes ipv4.method shared
sudo nmcli connection modify solartunes connection.autoconnect yes
```

The ipv4.method shared enables DHCP and NAT for the Wi-Fi clients.
Clients connecting to the AP get IPs in the 192.168.4.x range.
The Pi’s AP IP is 192.168.4.1.

## Step 2: Configure Ethernet (if needed, specially if you cannot access the Pi with a monitor and a keyboard)

Create or ensure Ethernet connection exists and uses DHCP:

```bash
sudo nmcli connection add type ethernet ifname eth0 con-name ethernet
sudo nmcli connection modify ethernet ipv4.method auto
sudo nmcli connection up ethernet
```


## Step 3: Start the Access Point

Bring the AP connection up:

```bash
sudo nmcli connection up solartunes
```

## Step 4: Verify the Setup

Check that wlan0 is in AP mode:

```bash
iw dev
```


Expected output snippet:

```bash
Interface wlan0
		ifindex 3
		wdev 0x1
		addr 2c:cf:67:f9:25:e2
		ssid solartunes
		type AP
		channel 6 (2437 MHz), width: 20 MHz, center1: 2437 MHz
		txpower 31.00 dBm
```

Check device status:

```bash
nmcli device status
```

Expected output:

```bash
DEVICE         TYPE      STATE                   CONNECTION
wlan0          wifi      connected               solartunes
eth0           ethernet  connected               ethernet
lo             loopback  connected (externally)  lo
```

## Step 5: Connect and Test

* Connect any Wi-Fi device to SSID: solartunes
* Use password: **********
* Check that the device gets IP like 192.168.4.x
* Access your Node.js app at: http://192.168.4.1:3000 or http://solartunes.local:3000
* If Ethernet is plugged in, internet access is shared automatically

## Step 6: Enable Autoconnect on Boot

Make sure connections start on boot:

```bash
sudo nmcli connection modify solartunes connection.autoconnect yes
sudo nmcli connection modify ethernet connection.autoconnect yes
```

## Step 7: Make sure your Pi’s hostname is solartunes

Check hostname:

```bash
hostname
```

If it’s not solartunes, set it:
```bash
sudo hostnamectl set-hostname solartunes
```

Then reboot or restart hostname services.

## Step 8:  Ensure avahi-daemon (mDNS) is installed and running

avahi-daemon provides .local hostname resolution on the local network, even without internet.

Install and start:

```bash
sudo apt install avahi-daemon
sudo systemctl enable avahi-daemon
sudo systemctl start avahi-daemon
```

## Step 9: Add a fallback static IP entry for solartunes.local on clients (optional)

If your clients don’t support mDNS or .local resolution:

Access the Node.js app directly via IP: http://192.168.4.1:3000

Or add a manual hosts file entry on each client mapping solartunes.local to 192.168.4.1


## Notes

* If you are on a Mac or on an iPad / iPhone, make sure *Private Relay* is disabled, otherwise your machine cannot connect to *Private Relay* and gives you no access to `http://solartunes.local:3000`.


# ⚡ Solar Power Optimization

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


See section below for an *idea* how to do this.
     
## 🔋 TODO: Smart Battery-Powered Raspberry Pi with ESP-based Power Management

This project uses an ESP8266 or ESP32 to monitor battery voltage and automatically control the power state of a Raspberry Pi. It enables clean shutdowns when the battery is low and reboots the Pi when the battery is recharged.

## 🧹 Components

* Raspberry Pi (any model)
* ESP8266 or ESP32
* Lithium battery (with protection circuit or BMS) -> We use a usual Pb based battery, without any protection 🤷‍♀️
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


## 🧠 Logic Summary

```text
IF battery voltage < LOW_THRESHOLD:
    Signal Pi to shutdown
    Wait 30s
    Cut power to Pi

ELSE IF battery voltage > HIGH_THRESHOLD:
    Restore power to Pi
```


## 🔌 Circuit Overview

* **Voltage Divider:** Reduces battery voltage to ESP-safe levels (max 3.3V).
* **MOSFET:** Controls power line between battery and Pi.
* **ESP GPIO → Pi GPIO:** (Optional) For shutdown signaling.

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


## 🦪 ESP Sample Code (ESP8266/ESP32)

```cpp
const int analogPin = A0; // Or GPIO 34 for ESP32
const float R1 = 10000.0; // Voltage divider resistor 1 (top)
const float R2 = 10000.0; // Resistor 2 (bottom)
const float LOW_THRESHOLD = 11;
const float HIGH_THRESHOLD = 12;
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


## ⚠️ Notes

* Ensure the Raspberry Pi is configured to **boot on power restore**.
* Use a MOSFET with sufficient current rating.
* ESP can use **deep sleep** to conserve power when idle.


## 📦 To-Do

* [ ] Add circuit diagrams
* [ ] Add shutdown
* [ ] Test it if it really works ;-)

## Clone SD Card

```
➜  ~ diskutil list # find the SD Card

/dev/disk0 (internal, physical):
   #:                       TYPE NAME                    SIZE       IDENTIFIER
   0:      GUID_partition_scheme                        *500.3 GB   disk0
   1:                        EFI EFI                     314.6 MB   disk0s1
   2:                 Apple_APFS Container disk1         500.0 GB   disk0s2

/dev/disk1 (synthesized):
   #:                       TYPE NAME                    SIZE       IDENTIFIER
   0:      APFS Container Scheme -                      +500.0 GB   disk1
                                 Physical Store disk0s2
   1:                APFS Volume Macintosh HD - Data     459.6 GB   disk1s1
   2:                APFS Volume Preboot                 2.1 GB     disk1s2
   3:                APFS Volume Recovery                1.2 GB     disk1s3
   4:                APFS Volume VM                      4.3 GB     disk1s4
   5:                APFS Volume Macintosh HD            9.3 GB     disk1s5
   6:              APFS Snapshot com.apple.os.update-... 9.3 GB     disk1s5s1

/dev/disk2 (disk image):
   #:                       TYPE NAME                    SIZE       IDENTIFIER
   0:      GUID_partition_scheme                        +5.7 TB     disk2
   1:                        EFI EFI                     209.7 MB   disk2s1
   2:                 Apple_APFS Container disk3         5.7 TB     disk2s2

/dev/disk3 (synthesized):
   #:                       TYPE NAME                    SIZE       IDENTIFIER
   0:      APFS Container Scheme -                      +5.7 TB     disk3
                                 Physical Store disk2s2
   1:                APFS Volume Backups of ....... ... 475.8 GB   disk3s1

/dev/disk4 (external, physical):
   #:                       TYPE NAME                    SIZE       IDENTIFIER
   0:     FDisk_partition_scheme                        *63.9 GB    disk4
   1:             Windows_FAT_32 bootfs                  536.9 MB   disk4s1
   2:                      Linux                         63.3 GB    disk4s2

# Important is to find the **external** SD card. In this case it's 4, could also be 2 or any other number.

➜  ~ umount /dev/disk4 # make sure it is no longer mounted
umount: /dev/disk4: not currently mounted # well, that was expected, but I want to be sure

➜  ~ sudo dd if=/dev/disk4 of=~/pi-backup-new.img bs=4m status=progress # create a copy
```

Use *Raspberry Pi Imager* to copy it to a new SD Card: https://www.raspberrypi.com/software/



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

You can also follow our development process documented below.

### ⚒️Development Process 

#### 🪛Tools and Platforms

- **Online IDE:** [v0.dev](https://v0.dev)
- **Version Control:** Git, GitHub
- **Deployment Preview:** Vercel
- **Hardware Testing:** Raspberry Pi
- **Documentation Tools:** PlantUML
- **Security & Code Quality:** Dependabot, CodeQL

#### 🐝 Step-by-Step Workflow

1. **Start Development**
   - Use [v0.dev](https://v0.dev) as your online IDE to design and develop UI components.
   - Pro: It has some AI chatbot to quickly prototype new features.
   - Cons: It is very slow. The AI chatbot usually messes up your whole project and breaks already working features. It even deletes features. It is expensive. So handle with care and use on your own risk. 

2. **Create a Feature Branch**
   - Before any development, create a new feature branch from the `main` branch.

3. **Develop UI**

   * Build your UI components within the feature branch using v0.dev.

4. **Auto Commit & Push**

   * Ensure your development environment is configured to **automatically commit and push** changes to GitHub.

5. **Preview on Vercel**

   * Verify that your changes are deployed and previewable on Vercel.
   * Use this preview to test UI behavior and styling.

6. **Hardware Testing**

   * If the UI functions correctly in the preview, check out the feature branch on a physical **Raspberry Pi**.

7. **Iterate**

   * Continue iterating and testing until the feature works reliably on the target hardware.

8. **Create a Pull Request**

   * Open a **Pull Request (PR)** against the `main` branch.
   * Request reviews and merge once approved.

9. **Write Documentation**

   * Document the feature using tools like **PlantUML** for diagrams and explanations.

10. **Check Code Quality and Security**

    * Run **Dependabot** to check for dependency vulnerabilities.
    * Use **CodeQL** to analyze for coding errors and security issues.

##### Notes

* Keep commits atomic and well-documented.
* Tag PRs with appropriate labels for easier tracking.
* Use GitHub Actions for CI/CD, including automated testing and code checks.
* Maybe improve deployment on real hardware by automating it.



## 📄 License

This project is open source and available under the MIT License.

Copyright (c) 2025 CCL

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## 🆘 Support

- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join community discussions every Tuesday https://curious.bio/veranstaltungen/ or file an issue here in GitHub
- **Documentation**: Check this `README.md`
- **Community**: Connect with other SolarPunk makers at https://curious.bio
- **Security**: This project is a local installation, only. It's NOT supposed to put in/on the world wide web. If you find anything, see [SECURITY](SECURITY.md). USE THIS SOFTWARE ON YOUR OWN RISK. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY.

---

**Made with 🌱 and 🍄 for a sustainable future in the CCL https://curious.bio**
