#!/bin/bash
set -eux

# Install Chrome
echo "Installing Chrome..."
curl -o /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install -y /tmp/chrome.deb

# Set CHROME_PATH
echo "export CHROME_PATH=/usr/bin/google-chrome-stable" >> ~/.bashrc
export CHROME_PATH=/usr/bin/google-chrome-stable

# Continue with build
npm install
npm run build
