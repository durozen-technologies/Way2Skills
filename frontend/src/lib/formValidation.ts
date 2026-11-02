/**
 * Client-side form validation rules and helpers for Way2Skills forms.
 */

// Strict email regex requiring local-part, @, domain name, and at least a 2-character top-level domain.
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const VALID_TOPICS = [
  "Full Stack Development",
  "Internship",
  "Course Fees",
  "Certificates",
  "Other Enquiry",
] as const;

export const VALID_EDUCATION_LEVELS = [
  "school",
  "diploma",
  "undergraduate",
  "graduate",
  "other",
] as const;

/**
 * Validates a name field. Must not be empty or contain only whitespace.
 */
export function validateName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Name is required and cannot be empty.";
  }
  if (trimmed.length < 2) {
    return "Name must be at least 2 characters.";
  }
  if (trimmed.length > 100) {
    return "Name cannot exceed 100 characters.";
  }
  return null;
}

/**
 * Validates an email field. Must contain @ and a valid domain (e.g. user@example.com).
 */
export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Email address is required.";
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return "Please enter a valid email address (e.g. user@example.com).";
  }
  if (trimmed.length > 254) {
    return "Email address is too long.";
  }
  return null;
}

/**
 * Validates a phone number field. Must be exactly 10 digits.
 */
export function validatePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return "Phone number is required.";
  }
  if (digits.length !== 10) {
    return "Phone number must be exactly 10 digits.";
  }
  return null;
}

/**
 * Sanitizes input value to keep only up to 10 digits.
 */
export function sanitizePhoneDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 10);
}

/**
 * Validates topic selection for Contact form.
 */
export function validateTopic(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Please select an enquiry topic.";
  }
  if (!VALID_TOPICS.includes(trimmed as (typeof VALID_TOPICS)[number])) {
    return "Please select a valid topic from the list.";
  }
  return null;
}

/**
 * Validates education level for Admission form.
 */
export function validateEducation(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Please select your education level.";
  }
  if (!VALID_EDUCATION_LEVELS.includes(trimmed as (typeof VALID_EDUCATION_LEVELS)[number])) {
    return "Please select a valid education level.";
  }
  return null;
}

/**
 * Validates course selection for Admission form.
 */
export function validateCourse(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Please select a programme.";
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed) || trimmed.length > 180) {
    return "Please select a valid programme.";
  }
  return null;
}

/**
 * Validates message field for Contact form (required, cannot be only whitespace).
 */
export function validateContactMessage(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Message is required and cannot be empty.";
  }
  if (trimmed.length > 2000) {
    return "Message cannot exceed 2000 characters.";
  }
  return null;
}

/**
 * Validates optional message field for Admission form.
 */
export function validateAdmissionMessage(value: string): string | null {
  if (value.length > 2000) {
    return "Message cannot exceed 2000 characters.";
  }
  return null;
}
