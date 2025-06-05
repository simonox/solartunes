#!/bin/bash

# SolarTunes Update Script
# This script updates the project and restarts the service

set -e

echo "🔄 SolarTunes Update Script"
echo "=========================="

GREEN='\033[0;32m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

PROJECT_DIR="$HOME/solartunes"

cd "$PROJECT_DIR"

print_status "Stopping SolarTunes service..."
sudo systemctl stop solartunes

print_status "Updating project..."
git pull

print_status "Updating dependencies..."
pnpm install

print_status "Building project..."
pnpm build

print_status "Starting SolarTunes service..."
sudo systemctl start solartunes

print_status "Update complete! Service status:"
sudo systemctl status solartunes --no-pager
