document.addEventListener('DOMContentLoaded', async () => {
  const defaultIpBtn = document.getElementById('defaultIp');
  const addressList = document.getElementById('addressList');
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

  // Check for updates and load settings
  chrome.storage.sync.get(['updateAvailable', 'updateUrl', 'ipType', 'addresses', 'addressType', 'theme'], (result) => {
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

    // Handle default IP button
    defaultIpBtn.addEventListener('click', () => {
      const baseUrl = 'http://169.254.1.1';
      const url = rescueMode.checked 
        ? `${baseUrl}/cgi-bin/upgrade.cgi${themeParam}`
        : `${baseUrl}${themeParam}`;
      chrome.tabs.create({ url });
      window.close();
    });

    // Create buttons for custom addresses if using custom mode
    if (result.ipType === 'custom' && result.addresses && result.addresses.length > 0) {
      const addressType = result.addressType || 'ip';
      const buttonLabel = addressType === 'ip' ? 'IP' : 'hostname';
      
      result.addresses.forEach(address => {
        if (!address) return; // Skip empty addresses
        
        const button = document.createElement('button');
        button.textContent = `Open ${buttonLabel}: ${address}`;
        button.addEventListener('click', () => {
          chrome.tabs.create({ url: `http://${address}${themeParam}` });
          window.close();
        });
        addressList.appendChild(button);
      });
    } else {
      addressList.style.display = 'none';
    }
  });
});