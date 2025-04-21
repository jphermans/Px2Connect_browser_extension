document.addEventListener('DOMContentLoaded', () => {
  const getStartedButton = document.getElementById('getStartedButton');
  
  if (getStartedButton) {
    getStartedButton.addEventListener('click', () => {
      // Set the flag that user has seen welcome page
      chrome.storage.sync.set({ hasSeenWelcome: true }, () => {
        // Open the options page
        chrome.runtime.openOptionsPage(() => {
          // Close the welcome page after options page is opened
          chrome.runtime.sendMessage({ action: 'closeWelcomePage' });
        });
      });
    });
  }
}); 