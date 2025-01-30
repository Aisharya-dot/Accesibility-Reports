#!/bin/bash
# Exit on error
set -e

echo "🚀 Installing dependencies..."
npm install

echo "🚀 Installing Chrome..."
npx puppeteer browsers install chrome
echo "✅ Chrome Installed!"

echo "🚀 Build complete!"
