// src/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const requireManager = require('../middleware/requireManager');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Manager-only analytics:
router.get('/utilization', requireManager, analyticsController.getUtilization);
router.get('/skill-gap', requireManager, analyticsController.getSkillGap);
router.get('/project-status', requireManager, analyticsController.getProjectStatusDistribution);
router.get('/skill-distribution', requireManager, analyticsController.getSkillDistribution);

module.exports = router;
