#!/bin/bash

# Get version from manifest.json
VERSION=$(cat manifest.json | grep '"version"' | cut -d'"' -f4)
echo "Creating extension packages for version ${VERSION}..."

# Create directory for Firefox version
mkdir -p firefox

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
cp background.js firefox/
cp options.html firefox/
cp options.js firefox/
cp popup.html firefox/
cp popup.js firefox/
cp styles.css firefox/
cp PF8-removebg-preview.png firefox/
cp px2.PNG firefox/

# Replace Chrome API calls with Firefox API calls in JavaScript files
for file in firefox/*.js; do
  sed -i '' 's/chrome\./browser\./g' "$file"
done

# Create Chrome Web Store package
echo "Creating Chrome Web Store package..."
zip -r px2-connect-chrome.zip \
  manifest.json \
  background.js \
  options.html \
  options.js \
  popup.html \
  popup.js \
  styles.css \
  PF8-removebg-preview.png \
  px2.PNG

# Create Firefox Add-on package
echo "Creating Firefox Add-on package..."
cd firefox && zip -r ../px2-connect-firefox.zip \
  manifest.json \
  background.js \
  options.html \
  options.js \
  popup.html \
  popup.js \
  styles.css \
  PF8-removebg-preview.png \
  px2.PNG
cd ..

echo "Created extension packages:"
echo "- px2-connect-chrome.zip (for Chrome Web Store)"
echo "- px2-connect-firefox.zip (for Firefox Add-ons)"
echo ""
echo "Next steps:"
echo "1. Submit px2-connect-chrome.zip to the Chrome Web Store"
echo "2. Submit px2-connect-firefox.zip to Firefox Add-ons" 