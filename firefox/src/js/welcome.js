document.addEventListener('DOMContentLoaded', () => {
  const getStartedButton = document.getElementById('getStartedButton');
  
  if (getStartedButton) {
    getStartedButton.addEventListener('click', () => {
      // Set the flag that user has seen welcome page
      browser.storage.sync.set({ hasSeenWelcome: true }, () => {
        // Open the options page
        browser.runtime.openOptionsPage(() => {
          // Close the welcome page after options page is opened
          browser.runtime.sendMessage({ action: 'closeWelcomePage' });
        });
      });
    });
  }
}); 