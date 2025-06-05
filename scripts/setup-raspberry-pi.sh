#!/bin/bash

# SolarTunes Raspberry Pi Setup Script
# This script sets up the complete environment for the music player

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user."
   exit 1
fi

print_header "🔧 Step 1: System Update"
print_status "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

print_header "🎵 Step 2: Install Audio Dependencies"
print_status "Installing ALSA and audio tools..."
sudo apt-get install -y alsa-utils pulseaudio pulseaudio-utils

print_header "📦 Step 3: Install Node.js"
# Check if Node.js is already installed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js is already installed: $NODE_VERSION"
    
    # Check if version is 18 or higher
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        print_warning "Node.js version is too old. Installing Node.js 20..."
        # Remove old Node.js
        sudo apt-get remove -y nodejs npm
        # Install Node.js 20
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
else
    print_status "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

print_header "📦 Step 4: Install pnpm"
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    print_status "pnpm is already installed: $PNPM_VERSION"
else
    print_status "Installing pnpm..."
    curl -fsSL https://get.pnpm.io/install.sh | sh -
    
    # Add pnpm to PATH for current session
    export PNPM_HOME="$HOME/.local/share/pnpm"
    export PATH="$PNPM_HOME:$PATH"
    
    # Add to shell profile
    echo 'export PNPM_HOME="$HOME/.local/share/pnpm"' >> ~/.bashrc
    echo 'export PATH="$PNPM_HOME:$PATH"' >> ~/.bashrc
fi

print_header "📁 Step 5: Setup Project Directory"
PROJECT_DIR="$HOME/solartunes"
print_status "Setting up project directory at $PROJECT_DIR"

# Create project directory if it doesn't exist
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Create Music directory
mkdir -p "$HOME/Music"
print_status "Created Music directory at $HOME/Music"

print_header "🔧 Step 6: Setup Audio Configuration"
print_status "Configuring audio settings..."

# Add user to audio group
sudo usermod -a -G audio $USER

# Create ALSA configuration
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

print_header "🚀 Step 7: Setup Systemd Service"
print_status "Creating systemd service for SolarTunes..."

# Create systemd service file
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

print_header "🔧 Step 8: Setup Log Rotation"
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

print_header "📝 Step 9: Create Helper Scripts"
print_status "Creating management scripts..."

# Create start script
cat > "$PROJECT_DIR/start-solartunes.sh" << 'EOL'
#!/bin/bash
cd "$(dirname "$0")"
echo "Starting SolarTunes..."
pnpm start
EOL

# Create stop script
cat > "$PROJECT_DIR/stop-solartunes.sh" << 'EOL'
#!/bin/bash
echo "Stopping SolarTunes..."
sudo systemctl stop solartunes
EOL

# Create restart script
cat > "$PROJECT_DIR/restart-solartunes.sh" << 'EOL'
#!/bin/bash
echo "Restarting SolarTunes..."
sudo systemctl restart solartunes
EOL

# Create status script
cat > "$PROJECT_DIR/status-solartunes.sh" << 'EOL'
#!/bin/bash
echo "SolarTunes Status:"
sudo systemctl status solartunes
echo ""
echo "Recent logs:"
sudo journalctl -u solartunes -n 20 --no-pager
EOL

# Make scripts executable
chmod +x "$PROJECT_DIR"/*.sh

print_header "🎵 Step 10: Create Test Audio Files"
print_status "Creating test audio files..."

# Install sox for audio generation
sudo apt-get install -y sox

cd "$HOME/Music"

# Create test files if they don't exist
if [ ! -f "test-tone.wav" ]; then
    print_status "Generating test audio files..."
    
    # Create a simple sine wave tone (440Hz = A note)
    sox -n -r 44100 -c 2 test-tone.wav synth 3 sine 440
    
    # Create a sweep from low to high frequency
    sox -n -r 44100 -c 2 frequency-sweep.wav synth 3 sine 300-1000
    
    # Create a chord
    sox -n -r 44100 -c 2 chord.wav synth 3 sine 440 sine 554 sine 659 gain -3
    
    print_status "Created test audio files in $HOME/Music"
else
    print_status "Test audio files already exist"
fi

cd "$PROJECT_DIR"

print_header "🔧 Step 11: Audio System Test"
print_status "Testing audio system..."

# Test if audio device is available
if aplay -l &> /dev/null; then
    print_status "Audio devices detected:"
    aplay -l
    
    # Test audio playback
    if [ -f "$HOME/Music/test-tone.wav" ]; then
        print_status "Testing audio playback (you should hear a tone)..."
        timeout 2s aplay "$HOME/Music/test-tone.wav" || print_warning "Audio test completed (or no audio output available)"
    fi
else
    print_warning "No audio devices detected. You may need to configure audio manually."
fi

print_header "📋 Step 12: Final Configuration"
print_status "Performing final setup steps..."

# Reload systemd
sudo systemctl daemon-reload

# Enable the service (but don't start it yet)
sudo systemctl enable solartunes

print_header "✅ Setup Complete!"
echo ""
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
echo "• Music Directory: $HOME/Music"
echo "• Service File: /etc/systemd/system/solartunes.service"
echo ""
echo "🌐 Access your sound player at: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
print_status "Reboot recommended to ensure all changes take effect."
