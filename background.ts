import { CONFIG, DEFAULT_SETTINGS, ExtensionSettings, UpdateInfo, ChromeRuntimeDetails } from './config';

/**
 * Cache for network interface checks
 */
let lastNetworkCheck: number | null = null;
let networkCheckResult: NetworkCheckResult | null = null;

/**
 * Initializes the extension and sets up event listeners
 */
chrome.runtime.onInstalled.addListener(async (details: ChromeRuntimeDetails) => {
  if (details.reason === 'install' || details.reason === 'update') {
    // Handle settings migration and preservation
    await handleSettingsMigration(details);

    // If this is an update, remove the old version
    if (details.reason === 'update' && details.previousVersion) {
      await handleOldVersionCleanup(details.previousVersion);
    }

    checkForUpdates();
  }
  
  // Set up periodic checks
  chrome.alarms.create('update-check', {
    periodInMinutes: CONFIG.UPDATE_CHECK_INTERVAL / (60 * 1000)
  });
});

/**
 * Handles the cleanup of old extension versions
 * @param previousVersion - The version number of the previous installation
 */
async function handleOldVersionCleanup(previousVersion: string): Promise<void> {
  try {
    const extensions = await chrome.management.getAll();
    const oldVersions = extensions.filter(ext => 
      ext.id !== chrome.runtime.id &&
      ext.name === chrome.runtime.getManifest().name &&
      ext.version === previousVersion
    );

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

/**
 * Handles settings migration and preservation during updates
 * @param details - Chrome runtime installation details
 */
async function handleSettingsMigration(details: ChromeRuntimeDetails): Promise<void> {
  try {
    const currentSettings = await chrome.storage.sync.get(null) as Partial<ExtensionSettings>;
    
    if (details.reason === 'install' || !currentSettings.settingsVersion) {
      await chrome.storage.sync.set(DEFAULT_SETTINGS);
      console.log('Default settings initialized');
      return;
    }

    if (details.reason === 'update') {
      const updatedSettings: ExtensionSettings = {
        ...DEFAULT_SETTINGS,
        ...currentSettings,
        settingsVersion: CONFIG.SETTINGS_VERSION
      };
      
      await chrome.storage.sync.set(updatedSettings);
      console.log('Settings preserved and updated during version upgrade');
    }
  } catch (error) {
    console.error('Error during settings migration:', error);
    await chrome.storage.sync.set(DEFAULT_SETTINGS);
  }
}

/**
 * Checks for updates from GitHub
 */
async function checkForUpdates(): Promise<void> {
  try {
    const response = await fetch(CONFIG.GITHUB_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const latestVersion = data.tag_name.replace('v', '');
    const currentVersion = chrome.runtime.getManifest().version;

    const updateInfo: UpdateInfo = {
      updateAvailable: isNewerVersion(latestVersion, currentVersion),
      latestVersion,
      updateUrl: data.html_url,
      lastUpdateCheck: Date.now(),
      updateCheckError: undefined
    };

    if (updateInfo.updateAvailable) {
      notifyUserOfUpdate(latestVersion);
    }

    await chrome.storage.sync.set({ updateInfo });
  } catch (error) {
    console.error('Error checking for updates:', error);
    await chrome.storage.sync.set({
      updateInfo: {
        updateAvailable: false,
        lastUpdateCheck: Date.now(),
        updateCheckError: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

/**
 * Compares two version strings to determine if the first is newer
 * @param latestVersion - The version to compare against
 * @param currentVersion - The current version
 * @returns True if latestVersion is newer than currentVersion
 */
function isNewerVersion(latestVersion: string, currentVersion: string): boolean {
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

/**
 * Notifies the user of an available update
 * @param newVersion - The new version number
 */
function notifyUserOfUpdate(newVersion: string): void {
  chrome.notifications.create('update-available', {
    type: 'basic',
    iconUrl: 'PF8-removebg-preview.png',
    title: 'Extension Update Available',
    message: `A new version (${newVersion}) of Px2 Connect is available. Click the extension icon to update.`,
    priority: 2
  });
}

// Listen for messages from other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkForUpdates') {
    checkForUpdates();
    sendResponse({ status: 'checking' });
  }
  return true;
});

// Listen for the alarm
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'update-check') {
    checkForUpdates();
  }
}); 