const usersService = require('../services/users.service');
const { sendSuccess } = require('../../../utils/response.util');

const getInstId = (req) => {
  const id = req.institutionId || req.user.institution?._id || req.user.institution;
  return (id === 'undefined' || id === 'null') ? null : id;
};

/** Throw 400 if no institution context — happens when superadmin hasn't sent x-institution-id */
const requireInstId = (req, res) => {
  const id = getInstId(req);
  if (!id) {
    res.status(400).json({
      success: false,
      message: 'Institution context is missing. Please select an institution first (x-institution-id header required for superadmin).',
    });
    return null;
  }
  return id;
};

const listUsers = async (req, res, next) => {
  try {
    const { role, isActive, page, limit } = req.query;
    const result = await usersService.listUsers(getInstId(req), {
      role,
      isActive: typeof isActive !== 'undefined' ? isActive === 'true' : undefined,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
    });
    sendSuccess(res, result);
  } catch (error) { next(error); }
};

const deactivateUser = async (req, res, next) => {
  try {
    const result = await usersService.deactivateUser(getInstId(req), req.params.id);
    sendSuccess(res, result, 'User deactivated');
  } catch (error) { next(error); }
};

const reactivateUser = async (req, res, next) => {
  try {
    const result = await usersService.reactivateUser(getInstId(req), req.params.id);
    sendSuccess(res, result, 'User reactivated');
  } catch (error) { next(error); }
};

const deleteUser = async (req, res, next) => {
  try {
    const result = await usersService.deleteUser(getInstId(req), req.params.id);
    sendSuccess(res, result, 'User deleted successfully');
  } catch (error) { next(error); }
};

const activateUser = async (req, res, next) => {
  try {
    const result = await usersService.activateUser(getInstId(req), req.params.id);
    sendSuccess(res, result, 'User activated and credentials sent securely');
  } catch (error) { next(error); }
};

const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const result = await usersService.changeUserRole(getInstId(req), req.params.id, role);
    sendSuccess(res, result, 'Role updated');
  } catch (error) { next(error); }
};

const bulkImportStudents = async (req, res, next) => {
  try {
    // req.body.rows: array of { name, email, studentId, batchYear, departmentId }
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ success: false, message: 'rows[] array is required' });
    }
    const result = await usersService.bulkImportStudents(getInstId(req), rows);
    sendSuccess(res, result, `Import complete: ${result.created} created, ${result.skipped} skipped`);
  } catch (error) { next(error); }
};

const getPreApprovedUsers = async (req, res, next) => {
  try {
    const instId = requireInstId(req, res);
    if (!instId) return;
    const result = await usersService.getPreApprovedUsers(instId);
    sendSuccess(res, { data: result });
  } catch (error) { next(error); }
};

const addPreApprovedUser = async (req, res, next) => {
  try {
    const instId = requireInstId(req, res);
    if (!instId) return;
    const result = await usersService.addPreApprovedUser(instId, req.body);
    sendSuccess(res, result, 'Added to Pre-Approved Registry');
  } catch (error) { next(error); }
};

const removePreApprovedUser = async (req, res, next) => {
  try {
    const instId = requireInstId(req, res);
    if (!instId) return;
    const result = await usersService.removePreApprovedUser(instId, req.params.id);
    sendSuccess(res, result, 'Removed from Pre-Approved Registry');
  } catch (error) { next(error); }
};

module.exports = { 
  listUsers, deactivateUser, reactivateUser, activateUser, changeUserRole, bulkImportStudents,
  getPreApprovedUsers, addPreApprovedUser, removePreApprovedUser, deleteUser
};
