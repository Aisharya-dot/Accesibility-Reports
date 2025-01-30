#!/bin/bash

# Ensure Puppeteer installs Chrome in the correct cache directory
export PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
export PUPPETEER_CONFIG_FILE=/opt/render/.cache/puppeteer

# Force-install Puppeteer’s bundled Chrome
npx puppeteer browsers install chrome

echo "Build completed successfully."
