// Update check configuration
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
const MANIFEST_VERSION = browser.runtime.getManifest().version;
const GITHUB_API_URL = 'https://api.github.com/repos/jphermans/Px2Connect_browser_extension/releases/latest';

// Settings migration configuration
const SETTINGS_VERSION = '1.0';
const DEFAULT_SETTINGS = {
  ipType: 'default',
  theme: 'flatdark',
  addresses: [],
  addressType: 'ip',
  settingsVersion: SETTINGS_VERSION,
  hasSeenWelcome: false
};

function showWelcomeAlert() {
  browser.tabs.create({
    url: browser.runtime.getURL('src/html/welcome.html')
  });
}

// Initialize update check on install/update
browser.runtime.onInstalled.addListener(async details => {
  console.log('Extension installed/updated:', details);

  try {
    // Always try to restore settings from local storage first
    const localBackup = await browser.storage.local.get('backupSettings');
    const syncSettings = await browser.storage.sync.get(null);
    
    // If we have sync settings, back them up
    if (syncSettings && Object.keys(syncSettings).length > 0) {
      await browser.storage.local.set({
        backupSettings: {
          ...syncSettings,
          backupTime: Date.now(),
          fromVersion: MANIFEST_VERSION
        }
      });
      console.log('Current settings backed up to local storage');
    }

    // Show welcome message on fresh install
    if (details.reason === 'install') {
      showWelcomeAlert();
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
      
      await browser.storage.sync.set(settingsToRestore);
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
        await browser.storage.sync.set(DEFAULT_SETTINGS);
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
      const localBackup = await browser.storage.local.get('backupSettings');
      if (localBackup.backupSettings) {
        await browser.storage.sync.set(localBackup.backupSettings);
        console.log('Settings restored from backup after error');
      } else {
        await browser.storage.sync.set(DEFAULT_SETTINGS);
      }
    } catch (backupError) {
      console.error('Error restoring from backup:', backupError);
      await browser.storage.sync.set(DEFAULT_SETTINGS);
    }
  }

  // Set up periodic checks
  browser.alarms.create('update-check', {
    periodInMinutes: UPDATE_CHECK_INTERVAL / (60 * 1000) // Convert ms to minutes
  });
});

// Listen for messages from other parts of the extension
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkForUpdates') {
    checkForUpdates();
    sendResponse({ status: 'checking' });
  } else if (message.action === 'closeWelcomePage') {
    if (sender.tab) {
      browser.tabs.remove(sender.tab.id);
    }
  }
  return true; // Keep the message channel open for async response
});

// Listen for the alarm
browser.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'update-check') {
    checkForUpdates();
  }
});

// Function to show notifications
function showNotification(id, options) {
  browser.notifications.create(id, {
    type: 'basic',
    iconUrl: '../images/PF8-removebg-preview.png',
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
      const currentSettings = await browser.storage.sync.get(null);
      await browser.storage.local.set({
        backupSettings: {
          ...currentSettings,
          backupTime: Date.now(),
          fromVersion: MANIFEST_VERSION
        }
      });

      // Store update info
      await browser.storage.sync.set({ 
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
      await browser.storage.sync.set({ 
        updateAvailable: false,
        lastUpdateCheck: Date.now()
      });
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
    await browser.storage.sync.set({ 
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
browser.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === 'manual-update') {
    browser.storage.sync.get(['updateUrl'], (result) => {
      if (result.updateUrl) {
        browser.tabs.create({ url: result.updateUrl });
      }
    });
  } else if (notificationId === 'settings-restored') {
    browser.tabs.create({ url: 'chrome://extensions/' });
  } else if (notificationId === 'new-install') {
    browser.runtime.openOptionsPage();
  }
});

// Handle notification button clicks
browser.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === 'manual-update') {
    if (buttonIndex === 0) { // "Download Update"
      browser.storage.sync.get(['updateUrl'], (result) => {
        if (result.updateUrl) {
          browser.tabs.create({ url: result.updateUrl });
        }
      });
    }
  } else if (notificationId === 'settings-restored') {
    if (buttonIndex === 0) { // "Open Extensions Page"
      browser.tabs.create({ url: 'chrome://extensions/' });
    }
  } else if (notificationId === 'new-install') {
    if (buttonIndex === 0) { // "Open Settings"
      browser.runtime.openOptionsPage();
    }
  }
});

// Handle extension icon clicks
browser.action.onClicked.addListener(() => {
  browser.storage.sync.get(['ipType', 'customIp', 'theme'], (result) => {
    const theme = result.theme || 'flatdark';
    const themeParam = `?theme=${theme}`;
    
    const url = result.ipType === 'custom' && result.customIp 
      ? `http://${result.customIp}${themeParam}`
      : `http://169.254.1.1${themeParam}`;
    
    browser.tabs.create({ url });
  });
});

// Handle keyboard shortcuts
browser.commands.onCommand.addListener(async (command) => {
  try {
    const settings = await browser.storage.sync.get(['ipType', 'addresses', 'theme']);
    const theme = settings.theme || 'flatdark';
    const themeParam = `?theme=${theme}`;
    
    switch (command) {
      case 'open-default':
        const rescueMode = await browser.storage.local.get('rescueMode');
        const baseUrl = 'http://169.254.1.1';
        const url = rescueMode.rescueMode 
          ? `${baseUrl}/cgi-bin/upgrade.cgi${themeParam}`
          : `${baseUrl}${themeParam}`;
        browser.tabs.create({ url });
        break;
      case 'open-custom-1':
        if (settings.ipType === 'custom' && settings.addresses?.[0]) {
          browser.tabs.create({ url: `http://${settings.addresses[0]}${themeParam}` });
        }
        break;
      case 'open-custom-2':
        if (settings.ipType === 'custom' && settings.addresses?.[1]) {
          browser.tabs.create({ url: `http://${settings.addresses[1]}${themeParam}` });
        }
        break;
      case 'toggle-rescue':
        const currentState = await browser.storage.local.get('rescueMode');
        const newState = !currentState.rescueMode;
        await browser.storage.local.set({ rescueMode: newState });
        // If default IP tab is open, update it
        const tabs = await browser.tabs.query({ url: 'http://169.254.1.1/*' });
        if (tabs.length > 0) {
          const newUrl = newState 
            ? `http://169.254.1.1/cgi-bin/upgrade.cgi${themeParam}`
            : `http://169.254.1.1${themeParam}`;
          browser.tabs.update(tabs[0].id, { url: newUrl });
        }
        break;
    }
  } catch (error) {
    console.error('Error handling command:', error);
  }
});