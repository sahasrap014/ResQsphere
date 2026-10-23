/**
 * Indian Mobile Phone Validation Utility
 * Complies with Department of Telecommunications (DoT) & TRAI Indian Mobile Numbering Plan.
 * Valid Indian mobile numbers are 10 digits, starting with 6, 7, 8, or 9.
 * May include optional country code prefix: +91, 91, or leading 0.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  error?: string;
}

/**
 * Normalizes and validates an Indian mobile number.
 * @param input Raw phone input string
 * @returns PhoneValidationResult with validity, normalized string, and error if invalid
 */
export function validateIndianMobile(input: string | undefined | null): PhoneValidationResult {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      normalized: '',
      error: 'Phone number is required. Enter a valid 10-digit Indian mobile number.',
    };
  }

  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return {
      isValid: false,
      normalized: '',
      error: 'Phone number is required. Enter a valid 10-digit Indian mobile number.',
    };
  }

  // Check for disallowed characters (letters, special symbols other than +, -, space, parentheses)
  if (/[a-zA-Z]/.test(trimmed) || /[^0-9+\s\-()]/.test(trimmed)) {
    return {
      isValid: false,
      normalized: trimmed,
      error: 'Enter a valid 10-digit Indian mobile number. Letters and special symbols are not allowed.',
    };
  }

  // Strip all non-digit characters except leading +
  let cleaned = trimmed.replace(/[\s\-()]/g, '');

  // Handle +91 prefix
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  // Cleaned must now be exactly 10 digits
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      normalized: trimmed,
      error: 'Enter a valid 10-digit Indian mobile number.',
    };
  }

  if (cleaned.length !== 10) {
    return {
      isValid: false,
      normalized: trimmed,
      error: `Phone number has ${cleaned.length} digits. Enter a valid 10-digit Indian mobile number.`,
    };
  }

  // Indian mobile numbers must start with 6, 7, 8, or 9
  const firstDigit = cleaned.charAt(0);
  if (!['6', '7', '8', '9'].includes(firstDigit)) {
    return {
      isValid: false,
      normalized: trimmed,
      error: `Invalid starting digit '${firstDigit}'. Indian mobile numbers must start with 6, 7, 8, or 9.`,
    };
  }

  // Standard normalized format: +91 XXXXX XXXXX
  const formatted = `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;

  return {
    isValid: true,
    normalized: formatted,
  };
}

/**
 * Quick boolean check for Indian mobile number
 */
export function isValidIndianMobile(input: string | undefined | null): boolean {
  return validateIndianMobile(input).isValid;
}
