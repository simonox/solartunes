# SolarTunes

## Setup Instructions:

1. **Copy the setup script to your Raspberry Pi:**

```shellscript
wget https://raw.githubusercontent.com/your-repo/solartunes/main/scripts/setup-raspberry-pi.sh
chmod +x setup-raspberry-pi.sh
```


2. **Run the setup script:**

```shellscript
./setup-raspberry-pi.sh
```


3. **Copy your project files to the Pi and deploy:**

```shellscript
# Copy your Next.js project files to ~/solartunes/
cd ~/solartunes
./deploy-project.sh
```


4. **Start the service:**

```shellscript
sudo systemctl start solartunes
```




## 🔧 What the setup script does:

- ✅ **System Updates**: Updates all packages
- ✅ **Audio Setup**: Installs ALSA and audio tools
- ✅ **Node.js 20**: Installs latest LTS version
- ✅ **pnpm**: Installs package manager
- ✅ **Audio Config**: Sets up audio permissions and config
- ✅ **Systemd Service**: Auto-start on boot
- ✅ **Log Rotation**: Manages log files
- ✅ **Test Files**: Creates sample .wav files
- ✅ **Helper Scripts**: Management utilities


## 🚀 Service Management:

```shellscript
# Start the service
sudo systemctl start solartunes

# Stop the service  
sudo systemctl stop solartunes

# Restart the service
sudo systemctl restart solartunes

# Check status
sudo systemctl status solartunes

# View logs
sudo journalctl -u solartunes -f
```

## 🌐 Access:

After setup, your SolarTunes player will be available at:
`http://[your-pi-ip]:3000`

The service will automatically start on boot, so your music player will always be ready! 🎵
