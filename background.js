// Check for updates periodically
chrome.runtime.onInstalled.addListener(() => {
  // Check for updates every 24 hours
  chrome.alarms.create('updateCheck', { periodInMinutes: 24 * 60 });
  checkForUpdates();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateCheck') {
    checkForUpdates();
  }
});

async function checkForUpdates() {
  try {
    const response = await fetch('https://api.github.com/repos/jphermans/Px2Connect_extension/releases/latest');
    const data = await response.json();
    const latestVersion = data.tag_name.replace('v', '');
    const currentVersion = chrome.runtime.getManifest().version;

    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;
    chrome.storage.sync.set({ 
      updateAvailable: hasUpdate,
      latestVersion: latestVersion,
      updateUrl: hasUpdate ? data.html_url : null
    });
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
}

function compareVersions(a, b) {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    const aVer = aParts[i] || 0;
    const bVer = bParts[i] || 0;
    if (aVer > bVer) return 1;
    if (aVer < bVer) return -1;
  }
  return 0;
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