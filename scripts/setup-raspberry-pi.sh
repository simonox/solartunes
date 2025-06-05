#!/bin/bash

# SolarTunes Raspberry Pi Setup Script
# This script sets up the complete environment for the sound player

set -e  # Exit on any error

echo "🌱 SolarTunes Raspberry Pi Setup Script"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check available disk space
check_disk_space() {
    if command -v df &> /dev/null; then
        AVAILABLE_KB=$(df . | tail -1 | awk '{print $4}')
        AVAILABLE_MB=$((AVAILABLE_KB / 1024))
        
        if [ "$AVAILABLE_MB" -lt 100 ]; then
            print_warning "Low disk space detected: ${AVAILABLE_MB}MB available"
            print_warning "Skipping file creation to preserve space"
            return 1
        else
            print_status "Disk space OK: ${AVAILABLE_MB}MB available"
            return 0
        fi
    fi
    return 0
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user."
   exit 1
fi

# Detect environment and set appropriate paths
PREVIEW_MODE=false
if [[ "$HOME" == "/home/runner" ]] || [[ "$HOME" == "/tmp"* ]] || [[ -z "$HOME" ]] || ! check_disk_space; then
    print_warning "Detected preview/sandbox environment or low disk space. Running in preview mode..."
    PREVIEW_MODE=true
    # Use current directory instead of creating new ones
    export PROJECT_DIR="$(pwd)"
    export MUSIC_DIR="$(pwd)/music-preview"
else
    export PROJECT_DIR="$HOME/solartunes"
    export MUSIC_DIR="$HOME/Music"
fi

print_header "🔧 Step 1: System Update"
if [ "$PREVIEW_MODE" = true ]; then
    print_status "Preview mode: Skipping system updates"
else
    print_status "Updating system packages..."
    sudo apt-get update
    sudo apt-get upgrade -y
fi

print_header "🎵 Step 2: Install Audio Dependencies"
if [ "$PREVIEW_MODE" = true ]; then
    print_status "Preview mode: Skipping audio package installation"
else
    print_status "Installing ALSA and audio tools..."
    sudo apt-get install -y alsa-utils pulseaudio pulseaudio-utils
fi

print_header "📦 Step 3: Install Node.js"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js is already installed: $NODE_VERSION"
else
    if [ "$PREVIEW_MODE" = true ]; then
        print_status "Preview mode: Node.js installation would be done on real Raspberry Pi"
    else
        print_status "Installing Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
fi

print_header "📦 Step 4: Install pnpm"
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    print_status "pnpm is already installed: $PNPM_VERSION"
else
    if [ "$PREVIEW_MODE" = true ]; then
        print_status "Preview mode: pnpm installation would be done on real Raspberry Pi"
    else
        print_status "Installing pnpm..."
        curl -fsSL https://get.pnpm.io/install.sh | sh -
        export PNPM_HOME="$HOME/.local/share/pnpm"
        export PATH="$PNPM_HOME:$PATH"
        echo 'export PNPM_HOME="$HOME/.local/share/pnpm"' >> ~/.bashrc
        echo 'export PATH="$PNPM_HOME:$PATH"' >> ~/.bashrc
    fi
fi

print_header "📁 Step 5: Setup Project Directory"
print_status "Project directory: $PROJECT_DIR"
print_status "Music directory: $MUSIC_DIR"

if [ "$PREVIEW_MODE" = false ]; then
    mkdir -p "$PROJECT_DIR"
    mkdir -p "$MUSIC_DIR"
    cd "$PROJECT_DIR"
fi

print_header "🔧 Step 6: Setup Audio Configuration"
if [ "$PREVIEW_MODE" = true ]; then
    print_status "Preview mode: Skipping audio configuration"
else
    print_status "Configuring audio settings..."
    sudo usermod -a -G audio $USER
    
    cat > ~/.asoundrc << 'EOL'
pcm.!default {
    type hw
    card 0
}
ctl.!default {
    type hw
    card 0
}
EOL
fi

print_header "🚀 Step 7: Setup Systemd Service"
if [ "$PREVIEW_MODE" = true ]; then
    print_status "Preview mode: Skipping systemd service creation"
else
    print_status "Creating systemd service for SolarTunes..."
    sudo tee /etc/systemd/system/solartunes.service > /dev/null << EOL
[Unit]
Description=SolarTunes Sound Player
After=network.target sound.target
Wants=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=$HOME/.local/share/pnpm/pnpm start
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=solartunes

[Install]
WantedBy=multi-user.target
EOL
fi

print_header "🔧 Step 8: Setup Log Rotation"
if [ "$PREVIEW_MODE" = true ]; then
    print_status "Preview mode: Skipping log rotation setup"
else
    print_status "Setting up log rotation..."
    sudo tee /etc/logrotate.d/solartunes > /dev/null << 'EOL'
/var/log/solartunes.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
}
EOL
fi

print_header "📝 Step 9: Create Helper Scripts"
if [ "$PREVIEW_MODE" = true ]; then
    print_status "Preview mode: Skipping helper script creation"
else
    print_status "Creating management scripts..."
    
    cat > "$PROJECT_DIR/start-solartunes.sh" << 'EOL'
#!/bin/bash
cd "$(dirname "$0")"
echo "Starting SolarTunes..."
pnpm start
EOL

    cat > "$PROJECT_DIR/stop-solartunes.sh" << 'EOL'
#!/bin/bash
echo "Stopping SolarTunes..."
sudo systemctl stop solartunes
EOL

    cat > "$PROJECT_DIR/restart-solartunes.sh" << 'EOL'
#!/bin/bash
echo "Restarting SolarTunes..."
sudo systemctl restart solartunes
EOL

    cat > "$PROJECT_DIR/status-solartunes.sh" << 'EOL'
#!/bin/bash
echo "SolarTunes Status:"
sudo systemctl status solartunes
echo ""
echo "Recent logs:"
sudo journalctl -u solartunes -n 20 --no-pager
EOL

    chmod +x "$PROJECT_DIR"/*.sh
fi

print_header "🎵 Step 10: Create Test Audio Files"
if [ "$PREVIEW_MODE" = true ]; then
    print_status "Preview mode: Test audio files will be simulated by the API"
else
    print_status "Creating test audio files..."
    sudo apt-get install -y sox
    
    cd "$MUSIC_DIR"
    
    if [ ! -f "test-tone.wav" ]; then
        print_status "Generating test audio files..."
        sox -n -r 44100 -c 2 test-tone.wav synth 3 sine 440
        sox -n -r 44100 -c 2 frequency-sweep.wav synth 3 sine 300-1000
        sox -n -r 44100 -c 2 chord.wav synth 3 sine 440 sine 554 sine 659 gain -3
        print_status "Created test audio files in $MUSIC_DIR"
    else
        print_status "Test audio files already exist"
    fi
    
    cd "$PROJECT_DIR"
fi

print_header "🔧 Step 11: Audio System Test"
if [ "$PREVIEW_MODE" = true ]; then
    print_status "Preview mode: Audio system test will be simulated"
else
    print_status "Testing audio system..."
    if aplay -l &> /dev/null; then
        print_status "Audio devices detected:"
        aplay -l
        
        if [ -f "$MUSIC_DIR/test-tone.wav" ]; then
            print_status "Testing audio playback (you should hear a tone)..."
            timeout 2s aplay "$MUSIC_DIR/test-tone.wav" || print_warning "Audio test completed"
        fi
    else
        print_warning "No audio devices detected. You may need to configure audio manually."
    fi
fi

print_header "📋 Step 12: Final Configuration"
if [ "$PREVIEW_MODE" = true ]; then
    print_status "Preview mode: Skipping systemd configuration"
else
    print_status "Performing final setup steps..."
    sudo systemctl daemon-reload
    sudo systemctl enable solartunes
fi

print_header "✅ Setup Complete!"
echo ""
if [ "$PREVIEW_MODE" = true ]; then
    print_status "Preview mode setup complete! 🎉"
    echo ""
    echo "📋 In a real Raspberry Pi environment:"
    echo "1. All system packages would be installed"
    echo "2. Audio system would be configured"
    echo "3. Systemd service would be created"
    echo "4. Test audio files would be generated"
    echo ""
    echo "🌐 The web interface is ready to preview with simulated data!"
else
    print_status "SolarTunes has been successfully set up on your Raspberry Pi!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Copy your Next.js project files to: $PROJECT_DIR"
    echo "2. Run 'cd $PROJECT_DIR && pnpm install' to install dependencies"
    echo "3. Run 'sudo systemctl start solartunes' to start the service"
    echo ""
    echo "🔧 Management Commands:"
    echo "• Start:   sudo systemctl start solartunes"
    echo "• Stop:    sudo systemctl stop solartunes"
    echo "• Restart: sudo systemctl restart solartunes"
    echo "• Status:  sudo systemctl status solartunes"
    echo "• Logs:    sudo journalctl -u solartunes -f"
    echo ""
    echo "📁 Important Paths:"
    echo "• Project Directory: $PROJECT_DIR"
    echo "• Music Directory: $MUSIC_DIR"
    echo "• Service File: /etc/systemd/system/solartunes.service"
    echo ""
    echo "🌐 Access your sound player at: http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    print_status "Reboot recommended to ensure all changes take effect."
fi
