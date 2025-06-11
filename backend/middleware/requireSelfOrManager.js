// src/middlewares/requireSelfOrManager.js
// Use for engineer updates: allow if manager or the user themselves
const requireSelfOrManager = (req, res, next) => {
  const { userId, role } = req.user || {};
  const paramId = req.params.id;
  if (role === 'manager' || userId === paramId) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Access denied' });
};

module.exports = requireSelfOrManager;
