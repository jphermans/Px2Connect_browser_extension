document.addEventListener('DOMContentLoaded', () => {
  // Set current year in developer info
  const developerInfo = document.querySelector('.developer-info');
  developerInfo.textContent = `Developed by JPHsystems © ${new Date().getFullYear()}`;

  const radioButtons = document.getElementsByName('ipType');
  const addressTypeRadios = document.getElementsByName('addressType');
  const themeRadios = document.getElementsByName('theme');
  const saveButton = document.getElementById('save');
  const versionSpan = document.getElementById('version');
  const checkUpdateButton = document.getElementById('checkUpdate');
  const updateStatus = document.getElementById('updateStatus');
  const addressList = document.getElementById('addressList');
  const addAddressButton = document.getElementById('addAddress');

  // Load saved settings
  chrome.storage.sync.get(['ipType', 'addresses', 'addressType', 'theme'], (result) => {
    const ipType = result.ipType || 'default';
    const addresses = result.addresses || [];
    const addressType = result.addressType || 'ip';
    const theme = result.theme || 'flatdark';
    
    radioButtons.forEach(radio => {
      radio.checked = radio.value === ipType;
    });
    addressTypeRadios.forEach(radio => {
      radio.checked = radio.value === addressType;
      radio.disabled = ipType === 'default';
    });
    themeRadios.forEach(radio => {
      radio.checked = radio.value === theme;
    });

    addAddressButton.disabled = ipType === 'default';
    
    // Populate saved addresses
    addresses.forEach(addr => addAddressEntry(addr));
    updateAddButton();
  });

  // Handle radio button changes
  radioButtons.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const isCustom = e.target.value === 'custom';
      addressTypeRadios.forEach(radio => radio.disabled = !isCustom);
      addAddressButton.disabled = !isCustom;
      if (!isCustom) {
        // Clear address list when switching to default
        addressList.innerHTML = '';
      } else if (addressList.children.length === 0) {
        // Add one empty address field when switching to custom
        addAddressEntry('');
      }
      updateAddButton();
    });
  });

  // Handle address type changes
  addressTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      updatePlaceholders();
    });
  });

  // Add address button
  addAddressButton.addEventListener('click', () => {
    addAddressEntry('');
    updateAddButton();
  });

  function addAddressEntry(value) {
    // Check for duplicates before adding
    const existingAddresses = Array.from(addressList.querySelectorAll('input')).map(input => input.value);
    if (value && existingAddresses.includes(value)) {
      alert('This address already exists in the list!');
      return;
    }

    const entry = document.createElement('div');
    entry.className = 'address-entry';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'customIp';
    input.value = value;
    input.placeholder = getPlaceholder();
    
    // Add input event listener to check for duplicates while typing
    input.addEventListener('input', (e) => {
      const currentValue = e.target.value.trim();
      const otherAddresses = Array.from(addressList.querySelectorAll('input'))
        .filter(inp => inp !== e.target)
        .map(inp => inp.value.trim());
      
      if (currentValue && otherAddresses.includes(currentValue)) {
        input.style.borderColor = '#dc2626';
        input.title = 'This address already exists in the list';
      } else {
        input.style.borderColor = '';
        input.title = '';
      }
    });
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-address';
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = () => {
      entry.remove();
      updateAddButton();
    };
    
    entry.appendChild(input);
    entry.appendChild(removeBtn);
    addressList.appendChild(entry);
  }

  function updateAddButton() {
    addAddressButton.disabled = 
      document.querySelector('input[name="ipType"]:checked').value === 'default' ||
      addressList.children.length >= 5;
  }

  function updatePlaceholders() {
    const placeholder = getPlaceholder();
    addressList.querySelectorAll('input').forEach(input => {
      input.placeholder = placeholder;
    });
  }

  function getPlaceholder() {
    const addressType = document.querySelector('input[name="addressType"]:checked').value;
    return addressType === 'ip' 
      ? 'Enter IP address (e.g., 192.168.1.1)' 
      : 'Enter hostname (e.g., device.local)';
  }

  function isValidAddress(address, type) {
    if (!address) return false;
    
    if (type === 'ip') {
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipPattern.test(address)) return false;
      
      const parts = address.split('.');
      return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });
    } else {
      const hostnamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      return hostnamePattern.test(address);
    }
  }

  // Handle save button
  saveButton.addEventListener('click', () => {
    const ipType = document.querySelector('input[name="ipType"]:checked').value;
    const addressType = document.querySelector('input[name="addressType"]:checked').value;
    const theme = document.querySelector('input[name="theme"]:checked').value;
    
    const addresses = Array.from(addressList.querySelectorAll('input')).map(input => input.value.trim());
    
    // Check for duplicates before saving
    const uniqueAddresses = new Set(addresses.filter(addr => addr !== ''));
    if (uniqueAddresses.size !== addresses.filter(addr => addr !== '').length) {
      alert('Please remove duplicate addresses before saving');
      return;
    }

    if (ipType === 'custom') {
      const invalidAddresses = addresses.filter(addr => !isValidAddress(addr, addressType));
      if (invalidAddresses.length > 0) {
        alert(addressType === 'ip' 
          ? 'Please enter valid IP addresses' 
          : 'Please enter valid hostnames');
        return;
      }
    }

    chrome.storage.sync.set({
      ipType: ipType,
      addresses: addresses,
      addressType: addressType,
      theme: theme
    }, () => {
      alert('Settings saved!');
      window.close();
    });
  });

  // Display version and handle update check
  const manifest = chrome.runtime.getManifest();
  versionSpan.textContent = manifest.version;

  checkUpdateButton.addEventListener('click', () => {
    updateStatus.textContent = 'Checking for updates...';
    chrome.runtime.sendMessage({ action: 'checkForUpdates' }, response => {
      if (chrome.runtime.lastError) {
        updateStatus.textContent = 'Error checking for updates';
        return;
      }
      
      chrome.storage.sync.get(['updateAvailable', 'latestVersion'], (result) => {
        if (result.updateAvailable) {
          updateStatus.textContent = `New version ${result.latestVersion} available!`;
          updateStatus.style.color = '#2563eb';
        } else {
          updateStatus.textContent = 'You have the latest version!';
          updateStatus.style.color = '#25EB3FFF';
        }
        
        setTimeout(() => {
          updateStatus.textContent = '';
          updateStatus.style.color = '';
        }, 5000);
      });
    });
  });
});