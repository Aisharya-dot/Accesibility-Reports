#!/bin/bash
# ✅ Exit immediately on error
set -e

echo "🚀 Installing Chrome..."
mkdir -p /opt/render/.cache/puppeteer
npx puppeteer browsers install chrome

echo "✅ Chrome Installed!"

echo "🚀 Installing Dependencies..."
npm install

echo "✅ Build Complete!"
