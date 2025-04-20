// Update check configuration
const UPDATE_CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const MANIFEST_VERSION = chrome.runtime.getManifest().version;
const GITHUB_API_URL = 'https://api.github.com/repos/jphermans/Px2Connect_browser_extension/releases/latest';

// Initialize update check on install/update
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install' || details.reason === 'update') {
    checkForUpdates();
  }
  // Set up periodic checks
  chrome.alarms.create('update-check', {
    periodInMinutes: UPDATE_CHECK_INTERVAL / (60 * 1000) // Convert ms to minutes
  });
});

// Listen for messages from other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkForUpdates') {
    checkForUpdates();
    sendResponse({ status: 'checking' });
  }
  return true; // Keep the message channel open for async response
});

// Listen for the alarm
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'update-check') {
    checkForUpdates();
  }
});

// Function to check for updates
async function checkForUpdates() {
  try {
    const response = await fetch(GITHUB_API_URL);
    if (!response.ok) {
      console.error('Update check failed:', response.status);
      return;
    }

    const data = await response.json();
    const latestVersion = data.tag_name.replace('v', '');

    if (isNewerVersion(latestVersion, MANIFEST_VERSION)) {
      console.log('New version available:', latestVersion);
      // Store update info
      chrome.storage.sync.set({ 
        updateAvailable: true,
        latestVersion: latestVersion,
        updateUrl: data.html_url,
        lastUpdateCheck: Date.now()
      });
      // Notify user
      notifyUserOfUpdate(latestVersion);
    } else {
      console.log('Extension is up to date');
      chrome.storage.sync.set({ 
        updateAvailable: false,
        lastUpdateCheck: Date.now()
      });
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
}

// Helper function to compare version numbers (Semantic Versioning)
function isNewerVersion(latestVersion, currentVersion) {
  const latestParts = latestVersion.split('.').map(Number);
  const currentParts = currentVersion.split('.').map(Number);

  for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
    const latest = latestParts[i] || 0;
    const current = currentParts[i] || 0;

    if (latest > current) return true;
    if (latest < current) return false;
  }

  return false; // Versions are equal
}

// Function to notify the user of an update
function notifyUserOfUpdate(newVersion) {
  chrome.notifications.create('update-available', {
    type: 'basic',
    iconUrl: 'PF8-removebg-preview.png',
    title: 'Extension Update Available',
    message: `A new version (${newVersion}) of Px2 Connect is available. Click the extension icon to update.`,
    priority: 2
  });
}

// Handle extension icon clicks
chrome.action.onClicked.addListener(() => {
  chrome.storage.sync.get(['ipType', 'customIp', 'theme'], (result) => {
    const theme = result.theme || 'flatdark';
    const themeParam = `?theme=${theme}`;
    
    const url = result.ipType === 'custom' && result.customIp 
      ? `http://${result.customIp}${themeParam}`
      : `http://169.254.1.1${themeParam}`;
    
    chrome.tabs.create({ url });
  });
});