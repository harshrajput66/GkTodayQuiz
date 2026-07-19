/**
 * Allowed email domains — only popular, authenticated mail providers
 */
const ALLOWED_DOMAINS = new Set([
  // Google
  'gmail.com',
  'googlemail.com',
  // Microsoft
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  // Yahoo
  'yahoo.com',
  'yahoo.co.in',
  'ymail.com',
  // Apple
  'icloud.com',
  'me.com',
  'mac.com',
  // ProtonMail
  'protonmail.com',
  'proton.me',
  // AOL
  'aol.com',
  // Zoho
  'zoho.com',
  'zohomail.in',
]);

/**
 * Check if an email address belongs to an allowed domain
 * @param {string} email
 * @returns {boolean}
 */
function isAllowedDomain(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? ALLOWED_DOMAINS.has(domain) : false;
}

module.exports = { ALLOWED_DOMAINS, isAllowedDomain };
