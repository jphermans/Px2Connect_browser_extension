import { CONFIG, DEFAULT_SETTINGS, ExtensionSettings } from './config';

/**
 * Validates an IP address
 * @param ip - The IP address to validate
 * @returns True if the IP address is valid
 */
function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) return false;
  
  return ip.split('.').every(octet => {
    const num = parseInt(octet, 10);
    return num >= 0 && num <= 255;
  });
}

/**
 * Validates a hostname
 * @param hostname - The hostname to validate
 * @returns True if the hostname is valid
 */
function isValidHostname(hostname: string): boolean {
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return hostnameRegex.test(hostname);
}

/**
 * Validates the extension settings
 * @param settings - The settings to validate
 * @returns Validation result with errors if any
 */
export function validateSettings(settings: Partial<ExtensionSettings>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (settings.ipType === 'custom') {
    if (!settings.addresses || settings.addresses.length === 0) {
      errors.push('At least one custom address is required in custom mode');
    } else {
      settings.addresses.forEach((address, index) => {
        if (!address) {
          errors.push(`Address ${index + 1} cannot be empty`);
        } else if (settings.addressType === 'ip' && !isValidIP(address)) {
          errors.push(`Invalid IP address: ${address}`);
        } else if (settings.addressType === 'hostname' && !isValidHostname(address)) {
          errors.push(`Invalid hostname: ${address}`);
        }
      });
    }
  }

  if (!settings.theme || !['flatdark', 'flatlight'].includes(settings.theme)) {
    errors.push('Invalid theme selected');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Saves settings to Chrome storage
 * @param settings - The settings to save
 * @returns Promise that resolves when settings are saved
 */
export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<{ success: boolean; errors?: string[] }> {
  const validation = validateSettings(settings);
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  try {
    const currentSettings = await chrome.storage.sync.get(null) as Partial<ExtensionSettings>;
    const updatedSettings: ExtensionSettings = {
      ...DEFAULT_SETTINGS,
      ...currentSettings,
      ...settings,
      settingsVersion: CONFIG.SETTINGS_VERSION
    };

    await chrome.storage.sync.set(updatedSettings);
    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
    return { 
      success: false, 
      errors: ['Failed to save settings. Please try again.'] 
    };
  }
}

/**
 * Loads settings from Chrome storage
 * @returns Promise that resolves with the loaded settings
 */
export async function loadSettings(): Promise<ExtensionSettings> {
  try {
    const settings = await chrome.storage.sync.get(null) as Partial<ExtensionSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      settingsVersion: CONFIG.SETTINGS_VERSION
    };
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
} 