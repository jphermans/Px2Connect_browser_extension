#!/bin/bash

# Get version from manifest.json
VERSION=$(cat manifest.json | grep '"version"' | cut -d'"' -f4)
echo "Creating extension packages for version ${VERSION}..."

# Create directory for Firefox version
mkdir -p firefox/src/{js,css,html,images}

# Create Firefox manifest
cat manifest.json | \
  sed 's/"manifest_version": 3/"manifest_version": 2/' | \
  sed 's/"action"/"browser_action"/' | \
  sed 's/"service_worker"/"scripts"/' | \
  sed 's/"host_permissions"/"permissions"/' | \
  sed 's/"system.network"/"browser.network"/' | \
  sed 's/"chrome.runtime"/"browser.runtime"/' | \
  sed 's/"chrome.storage"/"browser.storage"/' | \
  sed 's/"chrome.tabs"/"browser.tabs"/' | \
  sed 's/"chrome.notifications"/"browser.notifications"/' > firefox/manifest.json

# Copy and modify files for Firefox
cp -r src/* firefox/src/
sed -i '' 's/chrome\./browser\./g' firefox/src/js/*.js

# Create Chrome Web Store package
echo "Creating Chrome Web Store package..."
zip -r px2-connect-chrome.zip \
  manifest.json \
  src/js/background.js \
  src/js/options.js \
  src/js/popup.js \
  src/css/styles.css \
  src/html/options.html \
  src/html/popup.html \
  src/images/PF8-removebg-preview.png \
  src/images/px2.PNG

# Create Firefox Add-on package
echo "Creating Firefox Add-on package..."
cd firefox && zip -r ../px2-connect-firefox.zip \
  manifest.json \
  src/js/background.js \
  src/js/options.js \
  src/js/popup.js \
  src/css/styles.css \
  src/html/options.html \
  src/html/popup.html \
  src/images/PF8-removebg-preview.png \
  src/images/px2.PNG
cd ..

echo "Created extension packages:"
echo "- px2-connect-chrome.zip (for Chrome Web Store)"
echo "- px2-connect-firefox.zip (for Firefox Add-ons)"
echo ""
echo "Next steps:"
echo "1. Submit px2-connect-chrome.zip to the Chrome Web Store"
echo "2. Submit px2-connect-firefox.zip to Firefox Add-ons" 