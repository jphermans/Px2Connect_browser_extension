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
    // Get settings from sync storage
    const syncSettings = await chrome.storage.sync.get(null);
    console.log('Current sync settings:', syncSettings);

    // If we have settings in sync storage, save them to local storage as backup
    if (syncSettings && Object.keys(syncSettings).length > 0) {
      await chrome.storage.local.set({
        backupSettings: {
          ...syncSettings,
          backupTime: Date.now(),
          fromVersion: MANIFEST_VERSION
        }
      });
      console.log('Settings backed up to local storage');
    }

    // Handle both install and update cases
    if (details.reason === 'install' || details.reason === 'update') {
      // Check for backup settings
      const localBackup = await chrome.storage.local.get('backupSettings');
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

        // Show appropriate notification based on install type
        if (details.reason === 'update') {
          const previousVersion = details.previousVersion || 'unknown';
          showNotification('update-complete', {
            title: 'Px2 Connect Updated Successfully',
            message: `Updated from v${previousVersion} to v${MANIFEST_VERSION}\n\nTo complete the update:\n1. Go to your browser extensions (chrome://extensions/)\n2. Remove the old version of Px2 Connect\n\nYour settings have been preserved.`,
            buttons: [
              { title: 'Open Extensions Page' },
              { title: 'Got It' }
            ]
          });
        } else {
          showNotification('install-complete', {
            title: 'Px2 Connect Installed Successfully',
            message: 'Settings have been restored from your previous installation.\n\nPlease remove the old version of Px2 Connect from your extensions page.',
            buttons: [
              { title: 'Open Extensions Page' },
              { title: 'Got It' }
            ]
          });
        }
      } else {
        // No backup found, use defaults
        await chrome.storage.sync.set(DEFAULT_SETTINGS);
        console.log('No backup found, using default settings');

        if (details.reason === 'install') {
          showNotification('install-complete', {
            title: 'Px2 Connect Installed Successfully',
            message: 'The extension has been installed with default settings.\n\nClick to configure your preferences.',
            buttons: [
              { title: 'Open Settings' },
              { title: 'Got It' }
            ]
          });
        }
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
      
      // Back up current settings before update
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
        lastUpdateCheck: Date.now(),
        updateCheckError: null
      });

      // Show update notification with clear instructions
      showNotification('update-available', {
        title: 'Px2 Connect Update Available',
        message: `Version ${latestVersion} is available!\n\nTo update:\n1. Click this notification\n2. Download & install the new version\n3. Remove the old version from extensions page`,
        buttons: [
          { title: 'Update Now' },
          { title: 'Remind Me Later' }
        ]
      });
    } else {
      console.log('Extension is up to date');
      await chrome.storage.sync.set({ 
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

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === 'update-available') {
    if (buttonIndex === 0) { // "Update Now"
      chrome.storage.sync.get(['updateUrl'], (result) => {
        if (result.updateUrl) {
          chrome.tabs.create({ url: result.updateUrl });
        }
      });
    }
    // If buttonIndex is 1 ("Remind Me Later"), just close the notification
  } else if (notificationId === 'update-complete' || notificationId === 'install-complete') {
    if (buttonIndex === 0) {
      if (notificationId === 'update-complete' || notificationId === 'install-complete') {
        chrome.tabs.create({ url: 'chrome://extensions/' });
      } else {
        chrome.runtime.openOptionsPage();
      }
    }
  }
});

// Add notification click handler
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === 'update-available') {
    // Open the release page when update notification is clicked
    chrome.storage.sync.get(['updateUrl'], (result) => {
      if (result.updateUrl) {
        chrome.tabs.create({ url: result.updateUrl });
      }
    });
  } else if (notificationId === 'update-complete' || notificationId === 'install-complete') {
    // Open the extensions page when instructions notification is clicked
    chrome.tabs.create({ url: 'chrome://extensions/' });
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