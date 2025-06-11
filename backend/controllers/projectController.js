// Projects controller: handles CRUD operations for projects
// Manages project lifecycle, validation, and authorization
const Project = require('../models/Project');
const Assignment = require('../models/Assignment');

/**
 * Get all projects with optional filtering
 * Query params: status, startDate, endDate
 * Returns projects populated with manager info
 */
// In src/controllers/projectsController.js (or equivalent)
const getProjects = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const filter = {};

    // Handle status filter: allow single or multiple statuses
    if (status) {
      if (Array.isArray(status)) {
        // ?status=planning&status=active  => status is array
        filter.status = { $in: status };
      } else if (typeof status === 'string' && status.includes(',')) {
        // ?status=planning,active
        const arr = status.split(',').map(s => s.trim()).filter(Boolean);
        if (arr.length > 0) {
          filter.status = { $in: arr };
        }
      } else {
        // single status
        filter.status = status;
      }
    }

    // Date range filtering remains unchanged
    if (startDate || endDate) {
      filter.$and = [];
      if (startDate) {
        filter.$and.push({ endDate: { $gte: new Date(startDate) } });
      }
      if (endDate) {
        filter.$and.push({ startDate: { $lte: new Date(endDate) } });
      }
    }

    const projects = await Project.find(filter)
      .populate('managerId', 'name email')
      .sort({ startDate: -1 });

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



/**
 * Create new project (manager only)
 * Validates dates and required fields
 * Assigns current manager as project owner
 */
const createProject = async (req, res) => {
  try {
    const { name, description, startDate, endDate, requiredSkills, teamSize, status } = req.body;

    // Validate required fields
    if (!name || !description || !startDate || !endDate) {
      return res.status(400).json({ message: 'Name, description, start date, and end date are required' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    if (end <= start) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Validate team size
    if (teamSize && (teamSize < 1 || teamSize > 50)) {
      return res.status(400).json({ message: 'Team size must be between 1 and 50' });
    }

    const project = new Project({
      name: name.trim(),
      description: description.trim(),
      startDate: start,
      endDate: end,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills.map(skill => skill.trim()) : [],
      teamSize: teamSize || 1,
      status: status || 'planning',
      managerId: req.user.userId
    });

    await project.save();

    // Populate manager info for response
    await project.populate('managerId', 'name email');

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get project by ID with assignments
 * Returns project details with current assignments and assigned engineers
 */
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).populate('managerId', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (req.user.role === 'engineer') {
      // Check if this engineer has an assignment on this project
      const assignment = await Assignment.findOne({ projectId: id, engineerId: req.user.userId });
      if (!assignment) {
        return res.status(403).json({ message: 'Forbidden: You are not assigned to this project' });
      }
    }
    // For manager, optionally check ownership? PDF doesn't require manager-only view; managers can view all.
    const assignments = await Assignment.find({ projectId: id })
      .populate('engineerId', 'name email skills seniority maxCapacity');
    res.json({ ...project.toObject(), assignments });
  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


/**
 * Update project (manager only)
 * Validates ownership, dates, and existing assignments
 */
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find project and check ownership
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the project manager
    if (project.managerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied. You can only update your own projects' });
    }

    // Validate dates if provided
    if (updates.startDate || updates.endDate) {
      const newStartDate = updates.startDate ? new Date(updates.startDate) : project.startDate;
      const newEndDate = updates.endDate ? new Date(updates.endDate) : project.endDate;

      if (isNaN(newStartDate.getTime()) || isNaN(newEndDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }

      if (newEndDate <= newStartDate) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }

      // Check if date changes affect existing assignments
      const existingAssignments = await Assignment.find({ projectId: id });
      
      for (const assignment of existingAssignments) {
        // Check if assignment dates fall outside new project dates
        if (assignment.startDate < newStartDate || assignment.endDate > newEndDate) {
          return res.status(400).json({
            message: `Cannot update project dates. Assignment for engineer ${assignment.engineerId} falls outside new date range`
          });
        }
      }

      updates.startDate = newStartDate;
      updates.endDate = newEndDate;
    }

    // Validate team size
    if (updates.teamSize && (updates.teamSize < 1 || updates.teamSize > 50)) {
      return res.status(400).json({ message: 'Team size must be between 1 and 50' });
    }

    // Clean and validate required skills
    if (updates.requiredSkills) {
      updates.requiredSkills = Array.isArray(updates.requiredSkills) 
        ? updates.requiredSkills.map(skill => skill.trim()).filter(skill => skill.length > 0)
        : [];
    }

    // Clean text fields
    if (updates.name) updates.name = updates.name.trim();
    if (updates.description) updates.description = updates.description.trim();

    // Update project
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('managerId', 'name email');

    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete project (manager only)
 * Prevents deletion if assignments exist
 */
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Find project and check ownership
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the project manager
    if (project.managerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own projects' });
    }

    // Check for existing assignments
    const existingAssignments = await Assignment.find({ projectId: id });
    if (existingAssignments.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete project with existing assignments. Please remove all assignments first.',
        assignmentCount: existingAssignments.length
      });
    }

    // Delete project
    await Project.findByIdAndDelete(id);

    res.json({
      message: 'Project deleted successfully',
      projectId: id
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject
};