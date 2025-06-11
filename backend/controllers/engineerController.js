// Engineers controller: manages engineer profiles, capacity, and availability
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const { getCapacityInfo, getAvailabilityWindows } = require('../services/capacityService');
const { filterEngineersBySkills } = require('../services/skillMatchingService');

const getEngineers = async (req, res) => {
  try {
    const { skills } = req.query;

    let engineers;

    if (skills && typeof skills === 'string') {
      const skillArray = skills.split(',').map(skill => skill.trim());
      engineers = await filterEngineersBySkills(skillArray);
    } else {
      engineers = await User.find({ role: 'engineer' }).select('-passwordHash');
    }

    const engineersWithCapacity = await Promise.all(
      engineers.map(async (engineer) => {
        const capacityInfo = await getCapacityInfo(engineer._id.toString());
        return {
          ...engineer.toObject(),
          capacity: capacityInfo
        };
      })
    );

    res.json(engineersWithCapacity);
  } catch (error) {
    console.error('Get engineers error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getEngineerById = async (req, res) => {
  try {
    const { id } = req.params;

    const engineer = await User.findOne({
      _id: id,
      role: 'engineer'
    }).select('-passwordHash');

    if (!engineer) {
      res.status(404).json({ message: 'Engineer not found' });
      return;
    }

    const capacityInfo = await getCapacityInfo(id);

    const currentAssignments = await Assignment.find({
      engineerId: id,
      endDate: { $gte: new Date() }
    }).populate('projectId', 'name description status');

    res.json({
      ...engineer.toObject(),
      capacity: capacityInfo,
      currentAssignments
    });
  } catch (error) {
    console.error('Get engineer by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateEngineer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, skills, seniority, maxCapacity, department } = req.body;

    const canUpdate = req.user.role === 'manager' || req.user.userId === id;
    if (!canUpdate) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const engineer = await User.findOneAndUpdate(
      { _id: id, role: 'engineer' },
      {
        ...(name && { name }),
        ...(skills && { skills }),
        ...(seniority && { seniority }),
        ...(maxCapacity !== undefined && { maxCapacity }),
        ...(department && { department })
      },
      { new: true }
    ).select('-passwordHash');

    if (!engineer) {
      res.status(404).json({ message: 'Engineer not found' });
      return;
    }

    res.json({
      message: 'Engineer updated successfully',
      engineer
    });
  } catch (error) {
    console.error('Update engineer error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getEngineerCapacity = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const capacityInfo = await getCapacityInfo(id);

    res.json(capacityInfo);
  } catch (error) {
    console.error('Get engineer capacity error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getEngineerAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    const availabilityWindows = await getAvailabilityWindows(id);

    res.json({
      engineerId: id,
      availabilityWindows
    });
  } catch (error) {
    console.error('Get engineer availability error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getEngineers,
  getEngineerById,
  updateEngineer,
  getEngineerCapacity,
  getEngineerAvailability
};
