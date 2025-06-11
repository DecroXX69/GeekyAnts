// src/middlewares/requireManager.js
const requireManager = (req, res, next) => {
  if (!req.user || req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Forbidden: Manager only' });
  }
  next();
};

module.exports = requireManager;
