// src/routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireManager = require('../middleware/requireManager');
const {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject
} = require('../controllers/projectController');

router.use(authMiddleware);

// GET /api/projects?status=...&startDate=...&endDate=...
router.get('/', getProjects);

// GET /api/projects/:id
router.get('/:id', getProjectById);

// POST /api/projects  (manager only)
router.post('/', requireManager, createProject);

// PUT /api/projects/:id  (manager only)
router.put('/:id', requireManager, updateProject);

// DELETE /api/projects/:id  (manager only)
router.delete('/:id', requireManager, deleteProject);

module.exports = router;
