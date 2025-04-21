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
  console.log('Extension installed/updated:', details);
  
  try {
    // First, get current settings before any changes
    const currentSettings = await chrome.storage.sync.get(null);
    console.log('Current settings before migration:', currentSettings);

    // Get all installed extensions
    const extensions = await chrome.management.getAll();
    
    // Find other versions of this extension
    const otherVersions = extensions.filter(ext => 
      ext.id !== chrome.runtime.id && // Not the current version
      ext.name === chrome.runtime.getManifest().name // Same name
    );

    console.log('Found other versions:', otherVersions);

    // Prepare settings to migrate
    let settingsToMigrate = {};

    if (details.reason === 'install') {
      // For fresh install, use existing settings if available, otherwise use defaults
      settingsToMigrate = currentSettings && Object.keys(currentSettings).length > 0
        ? {
            ipType: currentSettings.ipType || DEFAULT_SETTINGS.ipType,
            theme: currentSettings.theme || DEFAULT_SETTINGS.theme,
            addresses: currentSettings.addresses || DEFAULT_SETTINGS.addresses,
            addressType: currentSettings.addressType || DEFAULT_SETTINGS.addressType,
            settingsVersion: SETTINGS_VERSION
          }
        : DEFAULT_SETTINGS;
    } else if (details.reason === 'update') {
      // For updates, preserve existing settings
      settingsToMigrate = {
        ipType: currentSettings.ipType || DEFAULT_SETTINGS.ipType,
        theme: currentSettings.theme || DEFAULT_SETTINGS.theme,
        addresses: currentSettings.addresses || DEFAULT_SETTINGS.addresses,
        addressType: currentSettings.addressType || DEFAULT_SETTINGS.addressType,
        settingsVersion: SETTINGS_VERSION
      };
    }

    // Save the settings before removing old versions
    await chrome.storage.sync.set(settingsToMigrate);
    console.log('Settings saved before cleanup:', settingsToMigrate);

    // Remove old versions if any exist
    if (otherVersions.length > 0) {
      for (const oldVersion of otherVersions) {
        try {
          await chrome.management.uninstall(oldVersion.id);
          console.log(`Removed old version: ${oldVersion.name} (${oldVersion.version})`);
        } catch (error) {
          console.error(`Failed to remove old version ${oldVersion.version}:`, error);
        }
      }
    }

    // Verify settings after cleanup
    const finalSettings = await chrome.storage.sync.get(null);
    console.log('Final settings after migration:', finalSettings);

    // Set up update checking
    checkForUpdates();
  } catch (error) {
    console.error('Error during version management:', error);
    // If something goes wrong, preserve existing settings if available
    const fallbackSettings = await chrome.storage.sync.get(null);
    if (!fallbackSettings || Object.keys(fallbackSettings).length === 0) {
      await chrome.storage.sync.set(DEFAULT_SETTINGS);
    }
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