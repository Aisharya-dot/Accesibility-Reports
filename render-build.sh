#!/bin/bash
set -eux

# ✅ Install Chrome using Puppeteer
echo "Installing Chrome for Puppeteer..."
npx puppeteer browsers install chrome

# ✅ Set Chrome path
export CHROME_PATH=$(npx puppeteer browsers path chrome)

# ✅ Persist CHROME_PATH for future runs
echo "export CHROME_PATH=$CHROME_PATH" >> ~/.bashrc

# ✅ Continue with build
npm install
npm run build
