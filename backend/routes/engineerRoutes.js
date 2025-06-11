// src/routes/engineerRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireManager = require('../middleware/requireManager');
const requireSelfOrManager = require('../middleware/requireSelfOrManager');
const {
  getEngineers,
  getEngineerById,
  updateEngineer,
  getEngineerCapacity,
  getEngineerAvailability
} = require('../controllers/engineerController');

router.use(authMiddleware);

// GET /api/engineers?skills=skill1,skill2  (manager only)
router.get('/', requireManager, getEngineers);

// GET /api/engineers/:id  (self or manager)
router.get('/:id', requireSelfOrManager, getEngineerById);

// PUT /api/engineers/:id  (self or manager)
router.put('/:id', requireSelfOrManager, updateEngineer);

// GET /api/engineers/:id/capacity  (self or manager)
router.get('/:id/capacity', requireSelfOrManager, getEngineerCapacity);

// GET /api/engineers/:id/availability  (self or manager)
router.get('/:id/availability', requireSelfOrManager, getEngineerAvailability);

module.exports = router;
