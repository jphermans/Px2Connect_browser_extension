chrome.action.onClicked.addListener(() => {
  chrome.storage.sync.get(['ipType', 'customIp'], (result) => {
    const url = result.ipType === 'custom' && result.customIp 
      ? `http://${result.customIp}`
      : 'http://169.254.1.1';
    
    chrome.tabs.create({ url });
  });
});