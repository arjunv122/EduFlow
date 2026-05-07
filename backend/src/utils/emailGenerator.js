/**
 * SRET Institutional Email Generator
 * ────────────────────────────────────
 * Pure functions — no DB calls, fully testable.
 *
 * Student format : e0{courseIndex}{YY}{seq:3}@domain
 *   e.g. e0126001@sret.edu.in
 *        ├── e0  = Engineering dept prefix
 *        ├── 1   = AI/ML course index
 *        ├── 26  = year 2026 (last 2 digits)
 *        └── 001 = 3-digit zero-padded sequence (1st student that year)
 *
 * Faculty format : {firstname.toLowerCase()}@domain
 *   e.g. advaita@sret.edu.in
 *   Conflict resolution: advaita2, advaita3, ...
 */

const { SRET_EMAIL_PREFIX, SRET_EMAIL_DOMAIN } = require('../config/sretCourses');

/**
 * Generate institutional student email.
 *
 * @param {number} courseIndex - e.g. 1 for AI/ML
 * @param {number} sequentialNumber - e.g. 1, 42 (raw integer from counter)
 * @param {number} [year] - Full year, defaults to current. e.g. 2026
 * @param {string} [domain] - Defaults to sret.edu.in
 * @returns {string} e.g. "e0126001@sret.edu.in"
 */
const generateStudentEmail = (
  courseIndex,
  sequentialNumber,
  year = new Date().getFullYear(),
  domain = SRET_EMAIL_DOMAIN
) => {
  const yy = String(year).slice(-2);                            // "2026" → "26"
  const seq = String(sequentialNumber).padStart(3, '0');       // 1 → "001"
  const local = `${SRET_EMAIL_PREFIX}${courseIndex}${yy}${seq}`; // "e01" + "26" + "001"
  return `${local}@${domain}`;
};

/**
 * Extract the base username from a full name (first word, lowercased, letters only).
 * "Advaita Sharma" → "advaita"
 * "Mary-Jane" → "maryjane"
 */
const nameToEmailLocal = (fullName) => {
  return fullName
    .trim()
    .split(/\s+/)[0]            // First word only
    .toLowerCase()
    .replace(/[^a-z]/g, '');    // Strip non-alpha
};

/**
 * Generate institutional faculty email.
 * Resolves conflicts by appending a number suffix.
 *
 * @param {string} fullName - e.g. "Advaita Sharma"
 * @param {string[]} existingEmails - All current emails at this domain (for conflict check)
 * @param {string} [domain]
 * @returns {string} e.g. "advaita@sret.edu.in" or "advaita2@sret.edu.in"
 */
const generateFacultyEmail = (
  fullName,
  existingEmails = [],
  domain = SRET_EMAIL_DOMAIN
) => {
  const base = nameToEmailLocal(fullName);
  if (!base) {
    // Fallback: timestamp-based if name is all special chars
    return `faculty${Date.now()}@${domain}`;
  }

  // Check conflict-free base
  const candidate = `${base}@${domain}`;
  if (!existingEmails.includes(candidate)) return candidate;

  // Append incrementing suffix
  let suffix = 2;
  while (existingEmails.includes(`${base}${suffix}@${domain}`)) {
    suffix++;
  }
  return `${base}${suffix}@${domain}`;
};

/**
 * Preview email for frontend (before actual registration).
 * Returns something like "e01260XX@sret.edu.in" (no real sequence yet).
 */
const previewStudentEmail = (courseIndex, domain = SRET_EMAIL_DOMAIN) => {
  const yy = String(new Date().getFullYear()).slice(-2);
  return `${SRET_EMAIL_PREFIX}${courseIndex}${yy}XXX@${domain}`;
};

module.exports = {
  generateStudentEmail,
  generateFacultyEmail,
  previewStudentEmail,
  nameToEmailLocal,
};
