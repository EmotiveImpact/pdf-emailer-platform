// Email configuration management
import { EMAIL_CREDENTIALS } from '@/config/emailCredentials';

export interface EmailConfig {
  mailgunDomain: string;
  mailgunApiKey: string;
  fromEmail: string;
  fromName: string;
}

// Default configuration - uses preset credentials from config file
const DEFAULT_CONFIG: EmailConfig = {
  mailgunDomain: EMAIL_CREDENTIALS.MAILGUN_DOMAIN,
  mailgunApiKey: EMAIL_CREDENTIALS.MAILGUN_API_KEY,
  fromEmail: EMAIL_CREDENTIALS.FROM_EMAIL,
  fromName: EMAIL_CREDENTIALS.FROM_NAME
};

// Configuration storage key
const CONFIG_STORAGE_KEY = 'email-config';

// Get configuration from localStorage or return default
export const getEmailConfig = (): EmailConfig => {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      const config = JSON.parse(stored);
      // Force update if old sandbox domain is found
      if (config.mailgunDomain && config.mailgunDomain.includes('sandbox19b0314ebe094b82a4a625dbce7e1425')) {
        console.log('Clearing old sandbox configuration...');
        localStorage.removeItem(CONFIG_STORAGE_KEY);
        return DEFAULT_CONFIG;
      }
      return config;
    }
  } catch (error) {
    console.warn('Failed to load email config from localStorage:', error);
  }
  return DEFAULT_CONFIG;
};

// Save configuration to localStorage
export const saveEmailConfig = (config: EmailConfig): void => {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn('Failed to save email config to localStorage:', error);
  }
};

// Reset configuration to default
export const resetEmailConfig = (): void => {
  try {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to reset email config:', error);
  }
};

// Check if configuration is valid (not default values)
export const isConfigValid = (config: EmailConfig): boolean => {
  return (
    config.mailgunDomain !== 'mg.yourdomain.com' &&
    config.mailgunApiKey !== 'key-your-api-key-here' &&
    config.mailgunDomain.length > 0 &&
    config.mailgunApiKey.length > 0 &&
    !config.mailgunDomain.includes('sandbox19b0314ebe094b82a4a625dbce7e1425')
  );
};

// Force update to new domain configuration
export const forceUpdateToNewDomain = (): void => {
  try {
    console.log('Forcing update to newwaterbill.com domain...');
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    // Save the new configuration
    const newConfig: EmailConfig = {
      mailgunDomain: 'newwaterbill.com',
      mailgunApiKey: EMAIL_CREDENTIALS.MAILGUN_API_KEY,
      fromEmail: 'statement@newwaterbills.com',
      fromName: 'New Water Systems, Inc.'
    };
    saveEmailConfig(newConfig);
  } catch (error) {
    console.warn('Failed to force update configuration:', error);
  }
};
