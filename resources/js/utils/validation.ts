/**
 * Validation patterns and utility functions for Sam-Edu frontend
 */

// Vietnamese phone format regex (10 digits starting with 03, 05, 07, 08, 09 or +84 / 84)
export const VIETNAMESE_PHONE_REGEX = /^(0|\+84|84)(3|5|7|8|9)[0-9]{8}$/;

// Username regex: alphanumeric, dot, underscore, hyphen (6 to 19 characters)
export const USERNAME_REGEX = /^[a-zA-Z0-9._-]+$/;

// Standard code regex (alphanumeric, underscore, hyphen)
export const CODE_REGEX = /^[a-zA-Z0-9_-]+$/;

// Validates a Vietnamese phone number
export function isValidVietnamesePhone(phone: string): boolean {
    if (!phone) return true;
    return VIETNAMESE_PHONE_REGEX.test(phone.trim());
}

// Validates a username (min 6, max 19, allowed chars)
export function isValidUsername(username: string): boolean {
    if (!username) return false;
    const trimmed = username.trim();
    return trimmed.length >= 6 && trimmed.length <= 19 && USERNAME_REGEX.test(trimmed);
}

// Validates a password (min 5, max 20)
export function isValidPassword(password: string): boolean {
    if (!password) return false;
    return password.length >= 5 && password.length <= 20;
}
