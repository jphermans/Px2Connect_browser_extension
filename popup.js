document.addEventListener('DOMContentLoaded', () => {
  const defaultIpBtn = document.getElementById('defaultIp');
  const customIpBtn = document.getElementById('customIp');

  chrome.storage.sync.get(['ipType', 'customIp', 'addressType', 'theme'], (result) => {
    const theme = result.theme || 'flatdark';
    const themeParam = `?theme=${theme}`;

    if (result.ipType !== 'custom' || !result.customIp) {
      // If no custom address is saved, immediately open default IP and close popup
      chrome.tabs.create({ url: `http://169.254.1.1${themeParam}` });
      window.close();
      return;
    }

    // Update custom button text to show the saved address
    const addressType = result.addressType || 'ip';
    const buttonLabel = addressType === 'ip' ? 'IP' : 'hostname';
    customIpBtn.textContent = `Open ${buttonLabel}: ${result.customIp}`;

    defaultIpBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: `http://169.254.1.1${themeParam}` });
      window.close();
    });

    customIpBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: `http://${result.customIp}${themeParam}` });
      window.close();
    });
  });
});