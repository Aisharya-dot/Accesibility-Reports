#!/bin/bash
set -eux

# Install Chrome (Manually Download & Extract)
echo "Installing Chrome..."
mkdir -p /opt/chrome
curl -o /tmp/chrome.zip https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb

# Extract Chrome files manually
dpkg-deb -x /tmp/chrome.zip /opt/chrome/

# Set CHROME_PATH
export CHROME_PATH="/opt/chrome/opt/google/chrome/google-chrome"
echo "export CHROME_PATH=$CHROME_PATH" >> ~/.bashrc

# Confirm Chrome installation
$CHROME_PATH --version

# Continue with build
npm install
npm run build
