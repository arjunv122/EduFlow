/**
 * Returns a Mongoose institution filter scoped to the requesting user's institution.
 * Every protected service method must include this in its query to prevent data leakage.
 *
 * Usage:
 *   const { getInstitutionFilter } = require('../../../utils/institutionFilter');
 *   const filter = { ...getInstitutionFilter(req), status: 'active' };
 */
const getInstitutionFilter = (req) => {
  const instId = req.user?.institution?._id || req.user?.institution;
  if (!instId) {
    // Superadmin has no institution — they pass institution explicitly via params/body
    return {};
  }
  return { institution: instId };
};

module.exports = { getInstitutionFilter };
