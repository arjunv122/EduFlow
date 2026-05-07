/**
 * SRET Course Email Configuration
 * ─────────────────────────────────
 * Maps course identifiers to their email index.
 * Format: e0{courseIndex}{YY}{seq:3}@sret.edu.in
 *
 * Example: AI/ML, student #1, 2026 → e0126001@sret.edu.in
 *
 * To extend in future for EduFlow multi-tenant domains:
 *   Replace `SRET_EMAIL_DOMAIN` with institution.emailDomain
 */

const SRET_EMAIL_DOMAIN = 'sret.edu.in';
const SRET_EMAIL_PREFIX = 'e0'; // Engineering department prefix (same for all 4 courses)

/**
 * Course index map.
 * Key   = course code (must match Course.code in DB — set by admin when creating courses)
 * Value = single digit appended after the dept prefix
 */
const SRET_COURSE_INDEX = {
  'AIML':    1,  // AI/ML Engineering
  'CYBER':   2,  // Cybersecurity
  'AIDA':    3,  // Artificial Intelligence & Data Analytics
  'MEDENG':  4,  // Medical Engineering
};

/**
 * Friendly names used in the frontend dropdown and emails
 */
const SRET_COURSE_LIST = [
  { code: 'AIML',   name: 'AI / Machine Learning',           index: 1 },
  { code: 'CYBER',  name: 'Cybersecurity',                   index: 2 },
  { code: 'AIDA',   name: 'AI & Data Analytics (AIDA)',      index: 3 },
  { code: 'MEDENG', name: 'Medical Engineering',             index: 4 },
];

/**
 * Default passwords issued on institutional account creation.
 * Users MUST change these on first login.
 */
const DEFAULT_PASSWORDS = {
  student: 'SRET@321',
  faculty: 'SRET@123',
};

module.exports = {
  SRET_EMAIL_DOMAIN,
  SRET_EMAIL_PREFIX,
  SRET_COURSE_INDEX,
  SRET_COURSE_LIST,
  DEFAULT_PASSWORDS,
};
