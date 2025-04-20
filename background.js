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
    
    // Get versions and remove 'v' prefix if present
    const latestVersion = data.tag_name.replace('v', '');
    const currentVersion = chrome.runtime.getManifest().version;

    // Compare versions and only show update if latest is newer
    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;
    
    // Update storage with version info
    chrome.storage.sync.set({ 
      updateAvailable: hasUpdate,
      latestVersion: latestVersion,
      updateUrl: hasUpdate ? data.html_url : null,
      lastCheckTime: Date.now()
    });

    console.log(`Version check: current=${currentVersion}, latest=${latestVersion}, update=${hasUpdate}`);
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
}

function compareVersions(version1, version2) {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  // Pad arrays with zeros if lengths differ
  while (v1Parts.length < 3) v1Parts.push(0);
  while (v2Parts.length < 3) v2Parts.push(0);
  
  // Compare each part numerically
  for (let i = 0; i < 3; i++) {
    if (v1Parts[i] > v2Parts[i]) return 1;
    if (v1Parts[i] < v2Parts[i]) return -1;
  }
  
  return 0; // versions are equal
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