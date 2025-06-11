// Assignment controller: handles engineer-project assignments
// Manages capacity validation, date conflicts, and assignment lifecycle
const Assignment = require('../models/Assignment');
const Project = require('../models/Project');
const User = require('../models/User');
const { getAvailableCapacity } = require('../services/capacityService');

/**
 * Get assignments with optional filtering
 * Query params: engineerId, projectId
 * Returns assignments populated with engineer and project info
 */
// In src/controllers/assignmentController.js

const getAssignments = async (req, res) => {
  try {
    const { engineerId: qEngineerId, projectId } = req.query;
    const filter = {};

    if (projectId) {
      filter.projectId = projectId;
    }
    if (req.user.role === 'manager') {
      // Manager: can filter by engineerId or see all
      if (qEngineerId) {
        filter.engineerId = qEngineerId;
      }
    } else if (req.user.role === 'engineer') {
      // Engineer: must only see their own assignments
      // If query param engineerId exists but is not their own, forbid
      if (qEngineerId && qEngineerId !== req.user.userId) {
        return res.status(403).json({ message: 'Forbidden: Cannot view other engineers\' assignments' });
      }
      filter.engineerId = req.user.userId;
    }
    // else: if other roles, adjust accordingly

   const assignments = await Assignment.find(filter)
  .populate('engineerId', 'name email skills seniority')
  .populate({
  path: 'projectId',
  select: 'name description status startDate endDate managerId priority', // Added priority
  populate: { path: 'managerId', select: 'name email' }
})
  .sort({ startDate: -1 });


    res.json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


/**
 * Create new assignment (manager only)
 * Validates capacity, date conflicts, and project status
 */
const createAssignment = async (req, res) => {
  try {
    const { engineerId, projectId, allocationPercentage, startDate, endDate, role } = req.body;

    // Validate required fields
    if (!engineerId || !projectId || !allocationPercentage || !startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Engineer, project, allocation percentage, start date, and end date are required' 
      });
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

    // Validate allocation percentage
    if (allocationPercentage < 1 || allocationPercentage > 100) {
      return res.status(400).json({ message: 'Allocation percentage must be between 1 and 100' });
    }

    // Verify engineer exists
    const engineer = await User.findById(engineerId);
    if (!engineer || engineer.role !== 'engineer') {
      return res.status(400).json({ message: 'Engineer not found' });
    }

    // Verify project exists and is active
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(400).json({ message: 'Project not found' });
    }

    if (!['planning', 'active'].includes(project.status)) {
      return res.status(400).json({ message: 'Cannot assign to completed or cancelled projects' });
    }

    // Check if assignment dates fall within project dates
    if (start < project.startDate || end > project.endDate) {
      return res.status(400).json({ 
        message: 'Assignment dates must fall within project dates' 
      });
    }

    // Check available capacity for the engineer
    const availableCapacity = await getAvailableCapacity(engineerId, start, end);
    if (availableCapacity < allocationPercentage) {
      return res.status(400).json({
        message: `Insufficient capacity. Available: ${availableCapacity}%, Requested: ${allocationPercentage}%`
      });
    }

    // Create assignment
    const assignment = new Assignment({
      engineerId,
      projectId,
      allocationPercentage,
      startDate: start,
      endDate: end,
      role: role || 'Developer'
    });

    await assignment.save();

    // Populate for response
    await assignment.populate([
      { path: 'engineerId', select: 'name email skills seniority' },
      { path: 'projectId', select: 'name description status' }
    ]);

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update assignment (manager only)
 * Validates capacity and date conflicts
 */
const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find existing assignment
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Validate dates if provided
    if (updates.startDate || updates.endDate) {
      const newStartDate = updates.startDate ? new Date(updates.startDate) : assignment.startDate;
      const newEndDate = updates.endDate ? new Date(updates.endDate) : assignment.endDate;

      if (isNaN(newStartDate.getTime()) || isNaN(newEndDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }

      if (newEndDate <= newStartDate) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }

      updates.startDate = newStartDate;
      updates.endDate = newEndDate;
    }

    // Validate allocation percentage
    if (updates.allocationPercentage !== undefined) {
      if (updates.allocationPercentage < 1 || updates.allocationPercentage > 100) {
        return res.status(400).json({ message: 'Allocation percentage must be between 1 and 100' });
      }
    }

    // Check capacity if allocation or dates changed
    if (updates.allocationPercentage || updates.startDate || updates.endDate) {
      const engineerId = assignment.engineerId;
      const startDate = updates.startDate || assignment.startDate;
      const endDate = updates.endDate || assignment.endDate;
      const allocationPercentage = updates.allocationPercentage || assignment.allocationPercentage;

      // Get available capacity excluding current assignment
      const availableCapacity = await getAvailableCapacity(engineerId, startDate, endDate, id);
      
      if (availableCapacity < allocationPercentage) {
        return res.status(400).json({
          message: `Insufficient capacity. Available: ${availableCapacity}%, Requested: ${allocationPercentage}%`
        });
      }
    }

    // Update assignment
    const updatedAssignment = await Assignment.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'engineerId', select: 'name email skills seniority' },
      { path: 'projectId', select: 'name description status' }
    ]);

    res.json({
      message: 'Assignment updated successfully',
      assignment: updatedAssignment
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete assignment (manager only)
 */
const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    await Assignment.findByIdAndDelete(id);

    res.json({
      message: 'Assignment deleted successfully',
      assignmentId: id
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment
};