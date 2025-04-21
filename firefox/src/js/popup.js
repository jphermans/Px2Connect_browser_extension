// Cache for network interface checks
const NETWORK_CHECK_CACHE_DURATION = 5000; // 5 seconds
let lastNetworkCheck = null;
let networkCheckResult = null;

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Function to check network interfaces with caching
async function checkNetworkInterfaces() {
  const now = Date.now();
  
  // Return cached result if it's still valid
  if (lastNetworkCheck && (now - lastNetworkCheck) < NETWORK_CHECK_CACHE_DURATION) {
    return networkCheckResult;
  }

  try {
    if (!browser.system || !browser.system.network) {
      return { available: false, error: 'System network API not available' };
    }

    const interfaces = await browser.system.network.getNetworkInterfaces();
    const hasMatchingIP = interfaces.some(iface => {
      return iface.address.startsWith('169.254.1.');
    });

    // Cache the result
    lastNetworkCheck = now;
    networkCheckResult = { available: true, hasMatchingIP };
    return networkCheckResult;
  } catch (error) {
    console.error('Network check failed:', error);
    return { available: false, error: error.message };
  }
}

// Function to update UI based on network check
const updateUI = debounce(async (result) => {
  const defaultIpBtn = document.getElementById('defaultIp');
  const defaultIpContainer = document.getElementById('defaultIpContainer');
  const networkMessage = document.getElementById('networkMessage');
  const loadingIndicator = document.querySelector('.loading-indicator');
  const rescueModeContainer = document.querySelector('.rescue-mode');

  if (loadingIndicator) {
    loadingIndicator.style.display = 'none';
  }

  if (!result.available) {
    showError('Network interface check not available. Some features may be limited.');
    return;
  }

  // Update rescue mode visibility
  rescueModeContainer.style.display = result.hasMatchingIP ? 'flex' : 'none';

  // Update default IP button visibility and show message
  if (result.hasMatchingIP) {
    defaultIpContainer.style.display = 'block';
    networkMessage.style.display = 'none';
  } else {
    defaultIpContainer.style.display = 'none';
    networkMessage.style.display = 'block';
    networkMessage.textContent = 'Connect to a device (169.254.1.x network) to enable default IP connection.';
  }
}, 300);

document.addEventListener('DOMContentLoaded', async () => {
  // Set current year in developer info
  const developerInfo = document.querySelector('.developer-info');
  const currentYear = new Date().getFullYear();
  developerInfo.innerHTML = `Developed by JPHsystems &copy; ${currentYear}`;

  const defaultIpBtn = document.getElementById('defaultIp');
  const addressList = document.getElementById('addressList');
  const updateBanner = document.getElementById('updateBanner');
  const rescueMode = document.getElementById('rescueMode');
  const rescueInfo = document.getElementById('rescueInfo');
  const rescueModeContainer = document.querySelector('.rescue-mode');
  
  // Create loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.textContent = 'Loading...';
  loadingIndicator.style.display = 'none';
  document.body.appendChild(loadingIndicator);

  // Create network message element
  const networkMessage = document.createElement('div');
  networkMessage.id = 'networkMessage';
  networkMessage.className = 'network-message';
  networkMessage.style.display = 'none';
  document.querySelector('.container').insertBefore(networkMessage, addressList);

  // Wrap default IP button in a container
  const defaultIpContainer = document.createElement('div');
  defaultIpContainer.id = 'defaultIpContainer';
  defaultIpBtn.parentNode.insertBefore(defaultIpContainer, defaultIpBtn);
  defaultIpContainer.appendChild(defaultIpBtn);

  // Initially hide rescue mode
  rescueModeContainer.style.display = 'none';

  // Show loading indicator
  loadingIndicator.style.display = 'block';

  // Check for updates immediately when popup opens
  browser.runtime.sendMessage({ action: 'checkForUpdates' });

  // Check network interfaces with caching
  const networkResult = await checkNetworkInterfaces();
  await updateUI(networkResult);

  // Show/hide rescue mode info
  rescueMode.addEventListener('change', () => {
    rescueInfo.style.display = rescueMode.checked ? 'block' : 'none';
  });

  // Lazy load settings
  const loadSettings = debounce(async () => {
    try {
      const result = await browser.storage.sync.get([
        'updateAvailable', 
        'updateUrl', 
        'ipType', 
        'addresses', 
        'addressType', 
        'theme', 
        'updateCheckError',
        'latestVersion'
      ]);

      const theme = result.theme || 'flatdark';
      const themeParam = `?theme=${theme}`;

      // Show error if update check failed
      if (result.updateCheckError) {
        showError(result.updateCheckError);
      }

      // Show update banner if update is available
      if (result.updateAvailable && result.updateUrl) {
        updateBanner.style.display = 'block';
        updateBanner.innerHTML = `<strong>New version ${result.latestVersion} available!</strong><br>Click here to update`;
        updateBanner.addEventListener('click', () => {
          browser.tabs.create({ url: result.updateUrl });
          window.close();
        });
      }

      // Handle default IP button
      defaultIpBtn.addEventListener('click', () => {
        const baseUrl = 'http://169.254.1.1';
        const url = rescueMode.checked 
          ? `${baseUrl}/cgi-bin/upgrade.cgi${themeParam}`
          : `${baseUrl}${themeParam}`;
        browser.tabs.create({ url });
        window.close();
      });

      // Create buttons for custom addresses if using custom mode
      if (result.ipType === 'custom' && result.addresses && result.addresses.length > 0) {
        const addressType = result.addressType || 'ip';
        const buttonLabel = addressType === 'ip' ? 'IP' : 'hostname';
        
        result.addresses.forEach(address => {
          if (!address) return;
          
          const button = document.createElement('button');
          button.textContent = `Open ${buttonLabel}: ${address}`;
          button.addEventListener('click', () => {
            browser.tabs.create({ url: `http://${address}${themeParam}` });
            window.close();
          });
          addressList.appendChild(button);
        });
      } else {
        addressList.style.display = 'none';
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      showError('Failed to load settings. Please try again.');
    }
  }, 100);

  // Start loading settings
  loadSettings();
});

function showError(message) {
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  document.body.insertBefore(errorElement, document.body.firstChild);
  setTimeout(() => errorElement.remove(), 5000);
}