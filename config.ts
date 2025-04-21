/**
 * Configuration constants for the extension
 */
export const CONFIG = {
  UPDATE_CHECK_INTERVAL: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
  NETWORK_CHECK_CACHE_DURATION: 5000, // 5 seconds
  SETTINGS_VERSION: '1.0',
  DEFAULT_THEME: 'flatdark',
  DEFAULT_IP: '169.254.1.1',
  GITHUB_API_URL: 'https://api.github.com/repos/jphermans/Px2Connect_browser_extension/releases/latest'
} as const;

/**
 * Default settings for the extension
 */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  ipType: 'default',
  theme: CONFIG.DEFAULT_THEME,
  addresses: [],
  addressType: 'ip',
  settingsVersion: CONFIG.SETTINGS_VERSION
};

/**
 * Type definitions for the extension
 */
export interface ExtensionSettings {
  ipType: 'default' | 'custom';
  theme: string;
  addresses: string[];
  addressType: 'ip' | 'hostname';
  settingsVersion: string;
}

export interface NetworkCheckResult {
  available: boolean;
  hasMatchingIP?: boolean;
  error?: string;
}

export interface UpdateInfo {
  updateAvailable: boolean;
  latestVersion?: string;
  updateUrl?: string;
  lastUpdateCheck: number;
  updateCheckError?: string;
}

export interface ChromeRuntimeDetails {
  reason: 'install' | 'update' | 'chrome_update' | 'shared_module_update';
  previousVersion?: string;
  id?: string;
} 