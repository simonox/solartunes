#!/bin/bash

# SolarTunes Autoplay Configuration Management Script
# Manages the ~/Music/autoplay.conf file for motion detection settings

echo "🎵 SolarTunes Autoplay Configuration Manager"
echo "==========================================="

CONFIG_FILE="$HOME/Music/autoplay.conf"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Function to show current configuration
show_config() {
    print_header "📋 Current Configuration"
    if [ -f "$CONFIG_FILE" ]; then
        echo "Configuration file: $CONFIG_FILE"
        echo "Contents:"
        cat "$CONFIG_FILE" | jq . 2>/dev/null || cat "$CONFIG_FILE"
    else
        print_warning "No configuration file found at $CONFIG_FILE"
        echo "Motion detection will use default settings"
    fi
}

# Function to set motion file
set_motion_file() {
    local file_name="$1"
    
    if [ -z "$file_name" ]; then
        echo "Available .wav files in ~/Music:"
        ls -1 "$HOME/Music"/*.wav 2>/dev/null | xargs -n1 basename || echo "No .wav files found"
        echo ""
        read -p "Enter filename (or 'none' to disable): " file_name
    fi
    
    if [ "$file_name" = "none" ] || [ "$file_name" = "" ]; then
        # Create config with no file selected
        cat > "$CONFIG_FILE" << EOL
{
  "enabled": false,
  "selectedFile": null,
  "lastSaved": "$(date -Iseconds)"
}
EOL
        print_status "Motion detection disabled"
    else
        # Check if file exists
        if [ -f "$HOME/Music/$file_name" ]; then
            # Create config with selected file
            cat > "$CONFIG_FILE" << EOL
{
  "enabled": true,
  "selectedFile": "$file_name",
  "lastSaved": "$(date -Iseconds)"
}
EOL
            print_status "Motion detection configured for: $file_name"
        else
            print_error "File not found: $HOME/Music/$file_name"
            return 1
        fi
    fi
}

# Function to enable/disable motion detection
toggle_motion() {
    if [ -f "$CONFIG_FILE" ]; then
        # Read current state
        current_enabled=$(cat "$CONFIG_FILE" | jq -r '.enabled' 2>/dev/null || echo "false")
        selected_file=$(cat "$CONFIG_FILE" | jq -r '.selectedFile' 2>/dev/null || echo "null")
        
        if [ "$current_enabled" = "true" ]; then
            new_enabled="false"
            print_status "Disabling motion detection"
        else
            new_enabled="true"
            print_status "Enabling motion detection"
        fi
        
        # Update config
        cat > "$CONFIG_FILE" << EOL
{
  "enabled": $new_enabled,
  "selectedFile": $selected_file,
  "lastSaved": "$(date -Iseconds)"
}
EOL
    else
        print_warning "No configuration file found. Creating default config..."
        cat > "$CONFIG_FILE" << EOL
{
  "enabled": true,
  "selectedFile": null,
  "lastSaved": "$(date -Iseconds)"
}
EOL
        print_status "Motion detection enabled (no file selected)"
    fi
}

# Function to backup configuration
backup_config() {
    if [ -f "$CONFIG_FILE" ]; then
        backup_file="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$CONFIG_FILE" "$backup_file"
        print_status "Configuration backed up to: $backup_file"
    else
        print_warning "No configuration file to backup"
    fi
}

# Function to restore configuration
restore_config() {
    echo "Available backup files:"
    ls -1 "${CONFIG_FILE}.backup."* 2>/dev/null || { print_warning "No backup files found"; return 1; }
    echo ""
    read -p "Enter backup filename to restore: " backup_file
    
    if [ -f "$backup_file" ]; then
        cp "$backup_file" "$CONFIG_FILE"
        print_status "Configuration restored from: $backup_file"
    else
        print_error "Backup file not found: $backup_file"
    fi
}

# Main menu
case "${1:-menu}" in
    "show"|"status")
        show_config
        ;;
    "set")
        set_motion_file "$2"
        ;;
    "toggle")
        toggle_motion
        ;;
    "backup")
        backup_config
        ;;
    "restore")
        restore_config
        ;;
    "menu"|*)
        echo ""
        echo "Choose an option:"
        echo "1) Show current configuration"
        echo "2) Set motion trigger file"
        echo "3) Enable/disable motion detection"
        echo "4) Backup configuration"
        echo "5) Restore configuration"
        echo "6) Exit"
        echo ""
        read -p "Enter your choice (1-6): " choice
        
        case $choice in
            1) show_config ;;
            2) set_motion_file ;;
            3) toggle_motion ;;
            4) backup_config ;;
            5) restore_config ;;
            6) print_status "Exiting..."; exit 0 ;;
            *) print_error "Invalid choice"; exit 1 ;;
        esac
        ;;
esac

echo ""
print_status "Configuration management complete!"
echo ""
print_status "📋 Quick commands:"
echo "  Show config:    ./scripts/manage-autoplay-config.sh show"
echo "  Set file:       ./scripts/manage-autoplay-config.sh set filename.wav"
echo "  Toggle motion:  ./scripts/manage-autoplay-config.sh toggle"
echo ""
print_status "🔄 Restart SolarTunes to apply changes: sudo systemctl restart solartunes"
