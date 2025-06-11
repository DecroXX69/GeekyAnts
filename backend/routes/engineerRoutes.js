// src/routes/engineerRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireManager = require('../middleware/requireManager');
const requireSelfOrManager = require('../middleware/requireSelfOrManager');
const User = require('../models/User');
const {
  getEngineers,
  getEngineerById,
  updateEngineer,
  getEngineerCapacity,
  getEngineerAvailability
} = require('../controllers/engineerController');


// In engineerRoutes.js, add before router.use(authMiddleware):
router.get('/skills', async (req, res) => {
  try {
    const engineers = await User.find({ role: 'engineer' }).select('skills');
    const allSkills = [...new Set(engineers.flatMap(e => e.skills || []))];
    res.json(allSkills);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching skills' });
  }
});

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
