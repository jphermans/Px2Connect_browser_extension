#!/bin/bash

# Get version from manifest.json
VERSION=$(cat manifest.json | grep '"version"' | cut -d'"' -f4)
echo "Creating extension packages for version ${VERSION}..."

# Create directories for different browser versions
mkdir -p firefox/src/{js,css,html,images}
mkdir -p safari/src/{js,css,html,images}

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

# Create Safari manifest
cat manifest.json | \
  sed 's/"manifest_version": 3/"manifest_version": 2/' | \
  sed 's/"action"/"browser_action"/' | \
  sed 's/"service_worker"/"background"/' | \
  sed 's/"system.network"/"network"/' | \
  sed 's/"chrome.runtime"/"safari.extension"/' | \
  sed 's/"chrome.storage"/"safari.extension.storage"/' | \
  sed 's/"chrome.tabs"/"safari.extension.tabs"/' | \
  sed 's/"chrome.notifications"/"safari.extension.notifications"/' > safari/manifest.json

# Copy and modify files for Firefox
cp -r src/* firefox/src/
sed -i '' 's/chrome\./browser\./g' firefox/src/js/*.js

# Copy and modify files for Safari
cp -r src/* safari/src/
sed -i '' 's/chrome\./safari\.extension\./g' safari/src/js/*.js

# Create Chrome Web Store package
echo "Creating Chrome Web Store package..."
zip -r px2-connect-chrome.zip \
  manifest.json \
  src/js/background.js \
  src/js/options.js \
  src/js/popup.js \
  src/css/styles.css \
  src/css/popup.css \
  src/css/options.css \
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
  src/css/popup.css \
  src/css/options.css \
  src/html/options.html \
  src/html/popup.html \
  src/images/PF8-removebg-preview.png \
  src/images/px2.PNG
cd ..

# Create Safari extension package
echo "Creating Safari extension package..."
cd safari && zip -r ../px2-connect-safari.zip \
  manifest.json \
  src/js/background.js \
  src/js/options.js \
  src/js/popup.js \
  src/css/styles.css \
  src/css/popup.css \
  src/css/options.css \
  src/html/options.html \
  src/html/popup.html \
  src/images/PF8-removebg-preview.png \
  src/images/px2.PNG
cd ..

echo "Created extension packages:"
echo "- px2-connect-chrome.zip (for Chrome Web Store)"
echo "- px2-connect-firefox.zip (for Firefox Add-ons)"
echo "- px2-connect-safari.zip (for Safari App Store)"
echo ""
echo "Next steps:"
echo "1. Submit px2-connect-chrome.zip to the Chrome Web Store"
echo "2. Submit px2-connect-firefox.zip to Firefox Add-ons"
echo "3. Submit px2-connect-safari.zip to the Safari App Store" 