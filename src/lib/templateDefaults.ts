// Default email template configuration
// This ensures all users get the latest default template

export const DEFAULT_EMAIL_TEMPLATE = {
  subject: 'Your New Water Systems Statement',
  content: `<p>Dear {{customerName}},</p>

<p>Please find attached your {{currentMonth}} statement for account {{accountNumber}}.</p>

<p>Pay your New Water Systems bill now at:<br>
<a href="http://www.newwaterbill.com/">http://www.newwaterbill.com/</a></p>

<p>Thank you,<br>
New Water Systems, Inc.</p>`,
  version: '2.0' // Increment this when you want to force update all users
};

// Check if template needs updating and update if necessary
export const ensureDefaultTemplate = (): void => {
  try {
    const stored = localStorage.getItem('defaultEmailTemplate');
    
    if (!stored) {
      // No template exists, save the default
      localStorage.setItem('defaultEmailTemplate', JSON.stringify({
        ...DEFAULT_EMAIL_TEMPLATE,
        updatedAt: new Date().toISOString()
      }));
      console.log('Default email template initialized');
      return;
    }

    // Check version and update if needed
    const parsed = JSON.parse(stored);
    if (!parsed.version || parsed.version !== DEFAULT_EMAIL_TEMPLATE.version) {
      // Template is outdated, update it
      localStorage.setItem('defaultEmailTemplate', JSON.stringify({
        ...DEFAULT_EMAIL_TEMPLATE,
        updatedAt: new Date().toISOString()
      }));
      console.log('Default email template updated to version', DEFAULT_EMAIL_TEMPLATE.version);
    }
  } catch (error) {
    console.error('Error ensuring default template:', error);
  }
};

// Force update the template (useful for migrations)
export const forceUpdateDefaultTemplate = (): void => {
  try {
    localStorage.setItem('defaultEmailTemplate', JSON.stringify({
      ...DEFAULT_EMAIL_TEMPLATE,
      updatedAt: new Date().toISOString()
    }));
    console.log('Default email template force updated');
  } catch (error) {
    console.error('Error force updating template:', error);
  }
};

