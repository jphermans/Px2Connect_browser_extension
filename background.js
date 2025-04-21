// Update check configuration
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
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
    // Always try to restore settings from local storage first
    const localBackup = await chrome.storage.local.get('backupSettings');
    const syncSettings = await chrome.storage.sync.get(null);
    
    // If we have sync settings, back them up
    if (syncSettings && Object.keys(syncSettings).length > 0) {
      await chrome.storage.local.set({
        backupSettings: {
          ...syncSettings,
          backupTime: Date.now(),
          fromVersion: MANIFEST_VERSION
        }
      });
      console.log('Current settings backed up to local storage');
    }

    // Determine if we should restore settings
    if (localBackup.backupSettings) {
      console.log('Found backup settings:', localBackup.backupSettings);
      
      // Restore settings from backup
      const settingsToRestore = {
        ipType: localBackup.backupSettings.ipType || DEFAULT_SETTINGS.ipType,
        theme: localBackup.backupSettings.theme || DEFAULT_SETTINGS.theme,
        addresses: localBackup.backupSettings.addresses || DEFAULT_SETTINGS.addresses,
        addressType: localBackup.backupSettings.addressType || DEFAULT_SETTINGS.addressType,
        settingsVersion: SETTINGS_VERSION
      };
      
      await chrome.storage.sync.set(settingsToRestore);
      console.log('Settings restored from backup');

      // Show notification about successful settings restoration
      showNotification('settings-restored', {
        title: 'Px2 Connect Settings Restored',
        message: 'Your previous settings have been restored.\n\nIMPORTANT: To complete the update process:\n1. Go to chrome://extensions\n2. Remove any old versions of Px2 Connect\n3. Keep only this new version',
        buttons: [
          { title: 'Open Extensions Page' },
          { title: 'Got It' }
        ]
      });
    } else {
      // No backup found, use defaults for new installations
      if (details.reason === 'install') {
        await chrome.storage.sync.set(DEFAULT_SETTINGS);
        console.log('New installation: using default settings');
        
        showNotification('new-install', {
          title: 'Px2 Connect Installed Successfully',
          message: 'The extension has been installed with default settings.\n\nClick to configure your preferences.',
          buttons: [
            { title: 'Open Settings' },
            { title: 'Got It' }
          ]
        });
      }
    }

    // Set up update checking
    checkForUpdates();
  } catch (error) {
    console.error('Error during settings management:', error);
    // If something goes wrong, try to restore from backup
    try {
      const localBackup = await chrome.storage.local.get('backupSettings');
      if (localBackup.backupSettings) {
        await chrome.storage.sync.set(localBackup.backupSettings);
        console.log('Settings restored from backup after error');
      } else {
        await chrome.storage.sync.set(DEFAULT_SETTINGS);
      }
    } catch (backupError) {
      console.error('Error restoring from backup:', backupError);
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

// Function to show notifications
function showNotification(id, options) {
  chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: 'PF8-removebg-preview.png',
    title: options.title,
    message: options.message,
    priority: 2,
    requireInteraction: true, // Notification will persist until user clicks it
    buttons: options.buttons || []
  });
}

// Function to check for updates
async function checkForUpdates() {
  try {
    const response = await fetch(GITHUB_API_URL);
    if (!response.ok) {
      throw new Error(`Failed to check for updates: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const latestVersion = data.tag_name.replace('v', '');

    if (isNewerVersion(latestVersion, MANIFEST_VERSION)) {
      console.log('New version available:', latestVersion);
      
      // Back up current settings
      const currentSettings = await chrome.storage.sync.get(null);
      await chrome.storage.local.set({
        backupSettings: {
          ...currentSettings,
          backupTime: Date.now(),
          fromVersion: MANIFEST_VERSION
        }
      });

      // Store update info
      await chrome.storage.sync.set({ 
        updateAvailable: true,
        latestVersion: latestVersion,
        updateUrl: data.html_url,
        lastUpdateCheck: Date.now()
      });

      // Show manual update notification
      showNotification('manual-update', {
        title: 'Px2 Connect Update Available',
        message: `Version ${latestVersion} is available!\n\nTo update manually:\n1. Click to download the new version\n2. Install the downloaded file\n3. Remove the old version from chrome://extensions`,
        buttons: [
          { title: 'Download Update' },
          { title: 'Later' }
        ]
      });
    } else {
      console.log('Extension is up to date');
      await chrome.storage.sync.set({ 
        updateAvailable: false,
        lastUpdateCheck: Date.now()
      });
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
    await chrome.storage.sync.set({ 
      updateCheckError: error.message,
      lastUpdateCheck: Date.now()
    });
  }
}

// Helper function to compare version numbers
function isNewerVersion(latestVersion, currentVersion) {
  const latestParts = latestVersion.split('.').map(Number);
  const currentParts = currentVersion.split('.').map(Number);

  for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
    const latest = latestParts[i] || 0;
    const current = currentParts[i] || 0;
    if (latest > current) return true;
    if (latest < current) return false;
  }
  return false;
}

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === 'manual-update') {
    chrome.storage.sync.get(['updateUrl'], (result) => {
      if (result.updateUrl) {
        chrome.tabs.create({ url: result.updateUrl });
      }
    });
  } else if (notificationId === 'settings-restored') {
    chrome.tabs.create({ url: 'chrome://extensions/' });
  } else if (notificationId === 'new-install') {
    chrome.runtime.openOptionsPage();
  }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === 'manual-update') {
    if (buttonIndex === 0) { // "Download Update"
      chrome.storage.sync.get(['updateUrl'], (result) => {
        if (result.updateUrl) {
          chrome.tabs.create({ url: result.updateUrl });
        }
      });
    }
  } else if (notificationId === 'settings-restored') {
    if (buttonIndex === 0) { // "Open Extensions Page"
      chrome.tabs.create({ url: 'chrome://extensions/' });
    }
  } else if (notificationId === 'new-install') {
    if (buttonIndex === 0) { // "Open Settings"
      chrome.runtime.openOptionsPage();
    }
  }
});

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