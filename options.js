document.addEventListener('DOMContentLoaded', () => {
  const customIpInput = document.getElementById('customIp');
  const radioButtons = document.getElementsByName('ipType');
  const addressTypeRadios = document.getElementsByName('addressType');
  const saveButton = document.getElementById('save');

  // Load saved settings
  chrome.storage.sync.get(['ipType', 'customIp', 'addressType'], (result) => {
    const ipType = result.ipType || 'default';
    const customIp = result.customIp || '';
    const addressType = result.addressType || 'ip';
    
    radioButtons.forEach(radio => {
      radio.checked = radio.value === ipType;
    });
    addressTypeRadios.forEach(radio => {
      radio.checked = radio.value === addressType;
      radio.disabled = ipType === 'default';
    });
    customIpInput.value = customIp;
    customIpInput.disabled = ipType === 'default';
    updatePlaceholder();
  });

  // Handle radio button changes
  radioButtons.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const isCustom = e.target.value === 'custom';
      customIpInput.disabled = !isCustom;
      addressTypeRadios.forEach(radio => {
        radio.disabled = !isCustom;
      });
      updatePlaceholder();
    });
  });

  // Handle address type changes
  addressTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      updatePlaceholder();
    });
  });

  function updatePlaceholder() {
    const addressType = document.querySelector('input[name="addressType"]:checked').value;
    customIpInput.placeholder = addressType === 'ip' 
      ? 'Enter IP address (e.g., 192.168.1.1)' 
      : 'Enter hostname (e.g., device.local)';
  }

  // Handle save button
  saveButton.addEventListener('click', () => {
    const ipType = document.querySelector('input[name="ipType"]:checked').value;
    const addressType = document.querySelector('input[name="addressType"]:checked').value;
    const customIp = customIpInput.value;

    if (ipType === 'custom' && !isValidAddress(customIp, addressType)) {
      alert(addressType === 'ip' 
        ? 'Please enter a valid IP address' 
        : 'Please enter a valid hostname');
      return;
    }

    chrome.storage.sync.set({
      ipType: ipType,
      customIp: customIp,
      addressType: addressType
    }, () => {
      alert('Settings saved!');
      // Close the options tab
      window.close();
    });
  });

  // Address validation helper
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
      // Hostname validation (basic rules)
      const hostnamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      return hostnamePattern.test(address);
    }
  }
});