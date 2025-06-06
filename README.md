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

\`\`\`bash
mkdir ~/solartunes
cd ~/solartunes
git clone https://github.com/simonox/solartunes.git .
\`\`\`

### 2. Run the Setup Script

\`\`\`bash
chmod +x scripts/setup-raspberry-pi.sh
./scripts/setup-raspberry-pi.sh
\`\`\`

### 3. Deploy the Project

\`\`\`bash
chmod +x scripts/deploy-project.sh
./scripts/deploy-project.sh
\`\`\`

### 4. Start the Service

\`\`\`bash
sudo systemctl start solartunes
\`\`\`

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

\`\`\`bash
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
\`\`\`

## 📁 Project Structure

\`\`\`
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
\`\`\`

## 🎵 Adding Your Own Sound Files

1. Copy your .wav files to the Music directory:
   \`\`\`bash
   cp your-sounds/*.wav ~/Music/
   \`\`\`

2. Refresh the web interface or restart the service:
   \`\`\`bash
   sudo systemctl restart solartunes
   \`\`\`

3. Your new files will appear in the Sound Library!

## 🌐 Access Your Sound Player

After setup, your SolarTunes player will be available at:

**Local Access:** `http://localhost:3000`

**Network Access:** `http://[your-pi-ip]:3000`

To find your Pi's IP address:
\`\`\`bash
hostname -I
\`\`\`

## 🔧 Troubleshooting

### Service Won't Start
\`\`\`bash
# Check service status
sudo systemctl status solartunes

# Check logs for errors
sudo journalctl -u solartunes -n 50

# Restart the service
sudo systemctl restart solartunes
\`\`\`

### No Audio Output
\`\`\`bash
# List audio devices
aplay -l

# Test audio with a file
aplay ~/Music/test-tone.wav

# Check audio groups
groups $USER
\`\`\`

### Web Interface Not Loading
\`\`\`bash
# Check if port 3000 is in use
sudo netstat -tlnp | grep :3000

# Check firewall settings
sudo ufw status

# Restart networking
sudo systemctl restart networking
\`\`\`

## 🔄 Updating SolarTunes

To update your installation:

\`\`\`bash
cd ~/solartunes
git pull
./scripts/deploy-project.sh
sudo systemctl restart solartunes
\`\`\`

## ⚡ Solar Power Optimization

For solar-powered setups:

1. **Monitor Power Usage:**
   \`\`\`bash
   # Check system load
   htop
   
   # Monitor power consumption
   vcgencmd measure_temp
   vcgencmd get_throttled
   \`\`\`

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
   -   lock SD Card in read only-mode
   -   unlock SD Card for uploading
   -   move log files to RAM disk (as SD Card is locked)

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

## 🆘 Support

- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join community discussions
- **Documentation**: Check the wiki for detailed guides
- **Community**: Connect with other SolarPunk makers

---

**Made with 🌱 for a sustainable future**
