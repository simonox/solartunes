# SolarTunes

A sustainable sound player for Raspberry Pi with SolarPunk aesthetics. Built with Next.js and designed for eco-friendly, solar-powered setups.

## 🌱 Features

- **🎵 Sound Library**: Browse and play .wav files from your Music directory
- **🎮 Simple Controls**: Click to play/stop with single-file playback protection
- **📊 System Monitoring**: Real-time system logs for debugging
- **🌿 SolarPunk Design**: Beautiful green gradients and nature-inspired UI
- **⚡ Low Power**: Optimized for solar-powered Raspberry Pi setups
- **🔄 Auto-Start**: Systemd service for automatic startup on boot

## 🚀 Quick Setup

### 1. Clone the Repository

<code>
mkdir ~/solartunes
cd ~/solartunes
git clone https://github.com/simonox/solartunes.git .
</code>

### 2. Run the Setup Script

<code>
chmod +x scripts/setup-raspberry-pi.sh
./scripts/setup-raspberry-pi.sh
</code>

### 3. Deploy the Project

<code>
chmod +x scripts/deploy-project.sh
./scripts/deploy-project.sh
</code>

### 4. Start the Service

<code>
sudo systemctl start solartunes
</code>

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

<code>
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
</code>

## 📁 Project Structure

<code>
~/solartunes/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── files/         # List .wav files
│   │   ├── play/          # Play audio files
│   │   ├── stop/          # Stop playback
│   │   ├── status/        # Check playback status
│   │   └── logs/          # System logs
│   ├── layout.tsx         # App layout
│   └── page.tsx           # Main sound player interface
├── scripts/               # Setup and management scripts
│   ├── setup-raspberry-pi.sh
│   ├── deploy-project.sh
│   ├── start-solartunes.sh
│   ├── stop-solartunes.sh
│   ├── restart-solartunes.sh
│   └── status-solartunes.sh
└── README.md
</code>

## 🎵 Adding Your Own Sound Files

1. Copy your .wav files to the Music directory:
   <code>cp your-sounds/*.wav ~/Music/</code>

2. Refresh the web interface or restart the service:
   <code>sudo systemctl restart solartunes</code>

3. Your new files will appear in the Sound Library!

## 🌐 Access Your Sound Player

After setup, your SolarTunes player will be available at:

**Local Access:** `http://localhost:3000`

**Network Access:** `http://[your-pi-ip]:3000`

To find your Pi's IP address:
<code>hostname -I</code>

## 🔧 Troubleshooting

### Service Won't Start

<code>
# Check service status
sudo systemctl status solartunes

# Check logs for errors
sudo journalctl -u solartunes -n 50

# Restart the service
sudo systemctl restart solartunes

### No Audio Output
# List audio devices
aplay -l

# Test audio with a file
aplay ~/Music/test-tone.wav

# Check audio groups
groups $USER

### Web Interface Not Loading
# Check if port 3000 is in use
sudo netstat -tlnp | grep :3000

# Check firewall settings
sudo ufw status

# Restart networking
sudo systemctl restart networking
</code>

## 🔄 Updating SolarTunes

To update your installation:

<code>
cd ~/solartunes/
./scripts/pdate-project.sh
</code>

## Wav files that does not work

Not all wav formats are supported, you can convert them using ffmpeg:

<code>
ffmpeg -i ~/Music/Testaudio_LR_getrennt.wav -acodec pcm_s16le -ac 2 -ar 44100 fixed.wav
</code>

## ⚡ Solar Power Optimization

For solar-powered setups:

1. **Monitor Power Usage:**
<code>
   # Check system load
   htop
   
   # Monitor power consumption
   vcgencmd measure_temp
   vcgencmd get_throttled
</code>

2. **Optimize Performance:**
   - Use efficient .wav files (lower bitrates for longer playback)
   - Enable auto-shutdown during low battery
   - Schedule playback during peak solar hours

3. **Battery Management:**
   - Monitor battery voltage in system logs -> I have no idea how to do this, as we just have a usual battery.
   - Set up low-power mode triggers -> Same, we don't know how much power is in the battery.
   - Use the sensor (movement and illumination) to detect night and day, when there is no light, put the Pi in power safe mode.

4. **To Dos**
   -  upload wav files
   -  install sensor (movement and illumination)
   -  lock SD Card in read only-mode
   -  unlock SD Card for uploading
   -  move log files to RAM disk (as SD Card is locked)
  
# Setup Access Point

🛠️ Step-by-Step Setup (No Internet Hotspot)
1. Update Raspberry Pi

sudo apt update && sudo apt upgrade -y
2. Install Access Point and DHCP Tools

sudo apt install hostapd dnsmasq
Enable hostapd:

sudo systemctl unmask hostapd
sudo systemctl enable hostapd
3. Assign Static IP to wlan0

Edit:

sudo nano /etc/dhcpcd.conf
Append:

interface wlan0
    static ip_address=192.168.4.1/24
    nohook wpa_supplicant
Restart service:

sudo service dhcpcd restart
4. Configure dnsmasq (DHCP Server)

Backup and create a new config:

sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.orig
sudo nano /etc/dnsmasq.conf
Add:

interface=wlan0
dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h
5. Configure hostapd (Wi-Fi Hotspot)

Create config:

sudo nano /etc/hostapd/hostapd.conf
Example:

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
Point hostapd to this file:

sudo nano /etc/default/hostapd
Add or update:

DAEMON_CONF="/etc/hostapd/hostapd.conf"
6. Start Services

sudo systemctl start hostapd
sudo systemctl start dnsmasq
sudo systemctl enable hostapd
sudo systemctl enable dnsmasq
✅ Final Result
The Pi creates a Wi-Fi network called MyPiAP.
Devices connecting to it get an IP (e.g., 192.168.4.2).
Your Node.js app is available at:
http://192.168.4.1:3000
Let me know if you’d like optional extras like:

A custom domain (e.g., http://mypi.local)
A captive portal-style redirect when users connect
Automatically opening the web app in a browser on Pi boot (for kiosk use)
You said:
A custom domain http://solartunes.local would be nice
ChatGPT said:
Perfect — you can achieve http://solartunes.local using mDNS (Multicast DNS), which allows local network hostname resolution without needing a DNS server.

Here's how to set it up:

🛠️ Enable solartunes.local Using avahi-daemon
1. Install avahi-daemon

sudo apt install avahi-daemon
2. Set the Hostname

Change the Raspberry Pi's hostname to solartunes:

sudo raspi-config
Choose: System Options → Hostname
Enter: solartunes
Or do it manually:

echo "solartunes" | sudo tee /etc/hostname
sudo sed -i 's/127.0.1.1.*/127.0.1.1 solartunes/' /etc/hosts
Reboot to apply the new hostname:

sudo reboot
✅ Done!
Now, any device that supports mDNS (like macOS, iOS, most Linux distros, and newer Android versions) can access your Node.js server with:

http://solartunes.local:3000

   

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

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## 🆘 Support

- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join community discussions
- **Documentation**: Check the wiki for detailed guides
- **Community**: Connect with other SolarPunk makers

---

**Made with 🌱 for a sustainable future**
