// Update check configuration
const UPDATE_CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const MANIFEST_VERSION = chrome.runtime.getManifest().version;
const GITHUB_API_URL = 'https://api.github.com/repos/jphermans/Px2Connect_browser_extension/releases/latest';

// Settings migration configuration
const SETTINGS_VERSION = '1.0';
const DEFAULT_SETTINGS = {
  ipType: 'default',
  theme: 'flatdark',
  addresses: [],
  addressType: 'ip',
  settingsVersion: SETTINGS_VERSION
};

// Initialize update check on install/update
chrome.runtime.onInstalled.addListener(async details => {
  if (details.reason === 'install' || details.reason === 'update') {
    // Handle settings migration and preservation
    await handleSettingsMigration(details);

    // If this is an update, remove the old version
    if (details.reason === 'update' && details.previousVersion) {
      try {
        // Get all installed extensions
        const extensions = await chrome.management.getAll();
        
        // Find the old version of this extension
        const oldVersions = extensions.filter(ext => 
          ext.id !== chrome.runtime.id && // Not the current version
          ext.name === chrome.runtime.getManifest().name && // Same name
          ext.version === details.previousVersion // Previous version
        );

        // Remove old versions
        for (const oldVersion of oldVersions) {
          try {
            await chrome.management.uninstall(oldVersion.id);
            console.log(`Removed old version ${oldVersion.version}`);
          } catch (error) {
            console.error(`Failed to remove old version ${oldVersion.version}:`, error);
          }
        }
      } catch (error) {
        console.error('Error during old version cleanup:', error);
      }
    }

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

// Function to handle settings migration and preservation
async function handleSettingsMigration(details) {
  try {
    // Get current settings
    const currentSettings = await chrome.storage.sync.get(null);
    
    // If this is a fresh install, set default settings
    if (details.reason === 'install' || !currentSettings.settingsVersion) {
      await chrome.storage.sync.set(DEFAULT_SETTINGS);
      console.log('Default settings initialized');
      return;
    }

    // If this is an update, check if settings need migration
    if (details.reason === 'update') {
      // Add any new settings that might be missing
      const updatedSettings = { ...DEFAULT_SETTINGS, ...currentSettings };
      updatedSettings.settingsVersion = SETTINGS_VERSION;
      
      // Save the updated settings
      await chrome.storage.sync.set(updatedSettings);
      console.log('Settings preserved and updated during version upgrade');
    }
  } catch (error) {
    console.error('Error during settings migration:', error);
    // If something goes wrong, ensure at least default settings are set
    await chrome.storage.sync.set(DEFAULT_SETTINGS);
  }
}

// Function to check for updates
async function checkForUpdates() {
  try {
    const response = await fetch(GITHUB_API_URL);
    if (!response.ok) {
      console.error('Update check failed:', response.status);
      chrome.storage.sync.set({ 
        updateCheckError: `Failed to check for updates: ${response.status} ${response.statusText}`,
        lastUpdateCheck: Date.now()
      });
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
        lastUpdateCheck: Date.now(),
        updateCheckError: null
      });
      // Notify user
      notifyUserOfUpdate(latestVersion);
    } else {
      console.log('Extension is up to date');
      chrome.storage.sync.set({ 
        updateAvailable: false,
        lastUpdateCheck: Date.now(),
        updateCheckError: null
      });
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
    chrome.storage.sync.set({ 
      updateCheckError: `Error checking for updates: ${error.message}`,
      lastUpdateCheck: Date.now()
    });
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