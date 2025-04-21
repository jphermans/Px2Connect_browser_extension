import { CONFIG } from './config';
import { loadSettings } from './settings';

/**
 * Keyboard shortcut configuration
 */
const SHORTCUTS = {
  OPEN_DEFAULT: 'Ctrl+Shift+1',
  OPEN_CUSTOM_1: 'Ctrl+Shift+2',
  OPEN_CUSTOM_2: 'Ctrl+Shift+3',
  OPEN_CUSTOM_3: 'Ctrl+Shift+4',
  TOGGLE_RESCUE: 'Ctrl+Shift+R'
} as const;

/**
 * Handles keyboard shortcut events
 * @param command - The command triggered by the shortcut
 */
async function handleShortcut(command: string): Promise<void> {
  const settings = await loadSettings();
  const themeParam = `?theme=${settings.theme}`;

  switch (command) {
    case 'open-default':
      chrome.tabs.create({ 
        url: `http://${CONFIG.DEFAULT_IP}${themeParam}` 
      });
      break;

    case 'open-custom-1':
    case 'open-custom-2':
    case 'open-custom-3':
      if (settings.ipType === 'custom' && settings.addresses.length > 0) {
        const index = parseInt(command.split('-')[2]) - 1;
        if (index < settings.addresses.length) {
          chrome.tabs.create({ 
            url: `http://${settings.addresses[index]}${themeParam}` 
          });
        }
      }
      break;

    case 'toggle-rescue':
      chrome.tabs.create({ 
        url: `http://${CONFIG.DEFAULT_IP}/cgi-bin/upgrade.cgi${themeParam}` 
      });
      break;
  }
}

/**
 * Registers keyboard shortcuts with Chrome
 */
export function registerShortcuts(): void {
  // Register default IP shortcut
  chrome.commands.onCommand.addListener(handleShortcut);
}

/**
 * Updates keyboard shortcuts based on current settings
 */
export async function updateShortcuts(): Promise<void> {
  const settings = await loadSettings();
  
  if (settings.ipType === 'custom') {
    // Enable custom shortcuts based on number of addresses
    chrome.commands.update({
      name: 'open-custom-1',
      shortcut: settings.addresses.length > 0 ? SHORTCUTS.OPEN_CUSTOM_1 : ''
    });
    chrome.commands.update({
      name: 'open-custom-2',
      shortcut: settings.addresses.length > 1 ? SHORTCUTS.OPEN_CUSTOM_2 : ''
    });
    chrome.commands.update({
      name: 'open-custom-3',
      shortcut: settings.addresses.length > 2 ? SHORTCUTS.OPEN_CUSTOM_3 : ''
    });
  } else {
    // Disable custom shortcuts in default mode
    chrome.commands.update({ name: 'open-custom-1', shortcut: '' });
    chrome.commands.update({ name: 'open-custom-2', shortcut: '' });
    chrome.commands.update({ name: 'open-custom-3', shortcut: '' });
  }
} 