// Assignment routes: defines API endpoints for assignment management
// All routes require authentication, create/update/delete require manager role
const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const authMiddleware = require('../middleware/authMiddleware');
const requireManager = require('../middleware/requireManager');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// GET /api/assignments - Get assignments with optional filtering
router.get('/', assignmentController.getAssignments);

// POST /api/assignments - Create new assignment (manager only)
router.post('/', requireManager, assignmentController.createAssignment);

// PUT /api/assignments/:id - Update assignment (manager only)
router.put('/:id', requireManager, assignmentController.updateAssignment);

// DELETE /api/assignments/:id - Delete assignment (manager only)
router.delete('/:id', requireManager, assignmentController.deleteAssignment);

module.exports = router;