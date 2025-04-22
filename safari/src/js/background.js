// Constants
const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const MANIFEST_VERSION = '1.0';

// Default settings
const DEFAULT_SETTINGS = {
    networkInterfaces: [],
    rescueMode: false,
    lastUpdateCheck: 0
};

// Initialize extension
safari.extension.addEventListener('message', handleMessage, false);

// Handle messages from popup and content scripts
function handleMessage(event) {
    const message = event.message;
    
    switch (message.action) {
        case 'checkForUpdates':
            checkForUpdates();
            break;
        case 'closeWelcomePage':
            if (event.target instanceof SafariContentWindow) {
                event.target.close();
            }
            break;
        default:
            console.log('Unknown message action:', message.action);
    }
}

// Check for updates
async function checkForUpdates() {
    try {
        const currentVersion = MANIFEST_VERSION;
        const response = await fetch('https://api.github.com/repos/yourusername/px2-connect/releases/latest');
        const data = await response.json();
        const latestVersion = data.tag_name.replace('v', '');

        if (latestVersion > currentVersion) {
            showNotification('Update Available', `Version ${latestVersion} is available. Click to update.`, 'update');
        }
    } catch (error) {
        console.error('Error checking for updates:', error);
    }
}

// Show notification
function showNotification(title, message, type) {
    safari.extension.notifications.create({
        title: title,
        message: message,
        type: type
    });
}

// Initialize settings
async function initializeSettings() {
    try {
        const settings = await safari.extension.storage.sync.get('settings');
        if (!settings.settings) {
            await safari.extension.storage.sync.set({ settings: DEFAULT_SETTINGS });
        }
    } catch (error) {
        console.error('Error initializing settings:', error);
    }
}

// Start periodic update checks
safari.extension.alarms.create('updateCheck', {
    periodInMinutes: 24 * 60 // 24 hours
});

safari.extension.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'updateCheck') {
        checkForUpdates();
    }
});

// Initialize on install
safari.extension.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        await initializeSettings();
        showNotification('Welcome to PX2 Connect', 'Click the extension icon to get started.', 'info');
    } else if (details.reason === 'update') {
        await checkForUpdates();
    }
});

// Start initialization
initializeSettings();
checkForUpdates(); 