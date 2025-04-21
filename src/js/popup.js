document.addEventListener('DOMContentLoaded', async () => {
    const defaultIpBtn = document.getElementById('defaultIp');
    const addressList = document.getElementById('addressList');
    const updateBanner = document.getElementById('updateBanner');
    let loadingIndicator = null;

    function showLoading(message = 'Loading...') {
        if (!loadingIndicator) {
            loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            document.body.appendChild(loadingIndicator);
        }
        loadingIndicator.textContent = message;
        loadingIndicator.style.display = 'block';
    }

    function hideLoading() {
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }

    function showError(message) {
        let errorDiv = document.querySelector('.error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            addressList.parentNode.insertBefore(errorDiv, addressList);
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    function showNetworkMessage(message) {
        let msgDiv = document.querySelector('.network-message');
        if (!msgDiv) {
            msgDiv = document.createElement('div');
            msgDiv.className = 'network-message';
            addressList.parentNode.insertBefore(msgDiv, addressList);
        }
        msgDiv.textContent = message;
    }

    async function checkNetworkInterfaces() {
        try {
            if (!chrome?.system?.network?.getNetworkInterfaces) {
                showError('Network API not available');
                return [];
            }

            const interfaces = await chrome.system.network.getNetworkInterfaces();
            return interfaces.filter(iface => 
                iface.address && 
                !iface.address.startsWith('169.254.') && 
                !iface.address.startsWith('fe80:')
            );
        } catch (error) {
            console.error('Network check error:', error);
            showError('Failed to check network interfaces');
            return [];
        }
    }

    async function checkForUpdates() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'checkForUpdates' });
            if (response?.latestVersion && response.currentVersion !== response.latestVersion) {
                updateBanner.innerHTML = `New version available (${response.latestVersion})`;
                updateBanner.style.display = 'block';
                updateBanner.style.cursor = 'pointer';
                updateBanner.onclick = () => {
                    chrome.tabs.create({ url: 'https://github.com/jphermans/ServicePort/releases/latest' });
                    window.close();
                };
            }
        } catch (error) {
            console.error('Update check error:', error);
        }
    }

    async function initialize() {
        showLoading('Initializing...');
        try {
            // Check for updates immediately
            await checkForUpdates();

            // Load settings
            const settings = await chrome.storage.sync.get(['ipType', 'addresses', 'addressType', 'theme', 'defaultPort']);
            const ipType = settings.ipType || 'default';
            const addresses = settings.addresses || [];
            const addressType = settings.addressType || 'ip';
            const defaultPort = settings.defaultPort || '8080';

            // Set up default button
            defaultIpBtn.onclick = () => {
                const baseUrl = 'http://169.254.1.1';
                const theme = settings.theme || 'flatdark';
                const themeParam = `?theme=${theme}`;
                chrome.tabs.create({ url: `${baseUrl}${themeParam}` });
                window.close();
            };

            // Check network interfaces
            const interfaces = await checkNetworkInterfaces();
            if (interfaces.length > 0) {
                showNetworkMessage(`Found ${interfaces.length} network interface(s)`);
            } else {
                showNetworkMessage('No valid network interfaces found');
            }

            // Clear existing buttons
            while (addressList.firstChild) {
                addressList.removeChild(addressList.firstChild);
            }

            // Add custom address buttons if in custom mode
            if (ipType === 'custom' && Array.isArray(addresses) && addresses.length > 0) {
                const buttonLabel = addressType === 'ip' ? 'IP' : 'hostname';
                const theme = settings.theme || 'flatdark';
                const themeParam = `?theme=${theme}`;
                
                addresses.forEach(address => {
                    if (!address) return;
                    
                    const button = document.createElement('button');
                    button.textContent = `Open ${buttonLabel}: ${address}`;
                    button.onclick = () => {
                        chrome.tabs.create({ url: `http://${address}${themeParam}` });
                        window.close();
                    };
                    addressList.appendChild(button);
                });
                addressList.style.display = 'block';
            } else {
                addressList.style.display = 'none';
            }
        } catch (error) {
            console.error('Initialization error:', error);
            showError('Failed to initialize popup');
        } finally {
            hideLoading();
        }
    }

    // Start initialization
    initialize();
});