document.addEventListener('DOMContentLoaded', async () => {
  const defaultIpBtn = document.getElementById('defaultIp');
  const customIpBtn = document.getElementById('customIp');
  const updateBanner = document.getElementById('updateBanner');
  const rescueMode = document.getElementById('rescueMode');
  const rescueInfo = document.getElementById('rescueInfo');
  const rescueModeContainer = document.querySelector('.rescue-mode');

  // Initially hide rescue mode
  rescueModeContainer.style.display = 'none';

  // Check if we're in the correct IP range
  try {
    const interfaces = await chrome.system.network.getNetworkInterfaces();
    const hasMatchingIP = interfaces.some(iface => {
      // Check if IP is in 169.254.1.x range
      return iface.address.startsWith('169.254.1.');
    });

    // Show rescue mode only if we're in the correct IP range
    if (hasMatchingIP) {
      rescueModeContainer.style.display = 'flex';
    }
  } catch (error) {
    console.error('Failed to check network interfaces:', error);
  }

  // Show/hide rescue mode info
  rescueMode.addEventListener('change', () => {
    rescueInfo.style.display = rescueMode.checked ? 'block' : 'none';
  });

  // Check for updates
  chrome.storage.sync.get(['updateAvailable', 'updateUrl', 'ipType', 'customIp', 'addressType', 'theme'], (result) => {
    const theme = result.theme || 'flatdark';
    const themeParam = `?theme=${theme}`;

    // Show update banner if update is available
    if (result.updateAvailable && result.updateUrl) {
      updateBanner.style.display = 'block';
      updateBanner.addEventListener('click', () => {
        chrome.tabs.create({ url: result.updateUrl });
        window.close();
      });
    }

    if (result.ipType !== 'custom' || !result.customIp) {
      // Don't auto-open when rescue mode is available
      defaultIpBtn.textContent = 'Open 169.254.1.1';
      customIpBtn.style.display = 'none';
      return;
    }

    // Update custom button text to show the saved address
    const addressType = result.addressType || 'ip';
    const buttonLabel = addressType === 'ip' ? 'IP' : 'hostname';
    customIpBtn.textContent = `Open ${buttonLabel}: ${result.customIp}`;

    defaultIpBtn.addEventListener('click', () => {
      const baseUrl = 'http://169.254.1.1';
      const url = rescueMode.checked 
        ? `${baseUrl}/cgi-bin/upgrade.cgi${themeParam}`
        : `${baseUrl}${themeParam}`;
      chrome.tabs.create({ url });
      window.close();
    });

    customIpBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: `http://${result.customIp}${themeParam}` });
      window.close();
    });
  });
});