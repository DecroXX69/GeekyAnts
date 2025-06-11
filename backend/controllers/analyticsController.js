// Analytics controller: provides utilization and skill gap analytics
// Generates insights for management dashboard and resource planning
const User = require('../models/User');
const Project = require('../models/Project');
const Assignment = require('../models/Assignment');
const { getCapacityInfo } = require('../services/capacityService');

/**
 * Get team utilization analytics
 * Returns individual and aggregated capacity utilization data
 */
const getUtilization = async (req, res) => {
  try {
    // Get all engineers
    const engineers = await User.find({ role: 'engineer' }).select('name email maxCapacity');
    
    if (engineers.length === 0) {
      return res.json({
        engineers: [],
        aggregated: {
          totalEngineers: 0,
          averageUtilization: 0,
          totalCapacity: 0,
          totalAllocated: 0,
          overutilizedCount: 0,
          underutilizedCount: 0
        }
      });
    }

    // Get capacity info for each engineer
    const engineerUtilization = [];
    let totalCapacity = 0;
    let totalAllocated = 0;
    let overutilizedCount = 0;
    let underutilizedCount = 0;

    for (const engineer of engineers) {
      const capacityInfo = await getCapacityInfo(engineer._id.toString());
      
      const engineerData = {
        engineerId: engineer._id,
        name: engineer.name,
        email: engineer.email,
        maxCapacity: capacityInfo.maxCapacity,
        allocatedCapacity: capacityInfo.allocatedCapacity,
        availableCapacity: capacityInfo.availableCapacity,
        utilizationPercent: capacityInfo.utilizationPercent
      };

      engineerUtilization.push(engineerData);

      // Aggregate statistics
      totalCapacity += capacityInfo.maxCapacity;
      totalAllocated += capacityInfo.allocatedCapacity;

      // Count over/under utilized (>90% over, <50% under)
      if (capacityInfo.utilizationPercent > 90) {
        overutilizedCount++;
      } else if (capacityInfo.utilizationPercent < 50) {
        underutilizedCount++;
      }
    }

    const averageUtilization = totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : 0;

    const aggregatedStats = {
      totalEngineers: engineers.length,
      averageUtilization,
      totalCapacity,
      totalAllocated,
      overutilizedCount,
      underutilizedCount
    };

    res.json({
      engineers: engineerUtilization,
      aggregated: aggregatedStats
    });
  } catch (error) {
    console.error('Get utilization error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get skill gap analysis for a specific project
 * Query param: projectId (required)
 * Returns missing skills based on assigned engineers vs required skills
 */
const getSkillGap = async (req, res) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    // Get project with required skills
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const requiredSkills = project.requiredSkills || [];
    
    if (requiredSkills.length === 0) {
      return res.json({
        projectId,
        projectName: project.name,
        requiredSkills: [],
        assignedEngineers: [],
        availableSkills: [],
        missingSkills: [],
        skillCoverage: 100
      });
    }

    // Get assignments for this project
    const assignments = await Assignment.find({ projectId })
      .populate('engineerId', 'name email skills');

    // Extract skills from assigned engineers
    const assignedEngineers = assignments.map(assignment => ({
      engineerId: assignment.engineerId._id,
      name: assignment.engineerId.name,
      email: assignment.engineerId.email,
      skills: assignment.engineerId.skills || [],
      role: assignment.role,
      allocation: assignment.allocationPercentage
    }));

    // Collect all available skills from assigned engineers
    const availableSkills = new Set();
    assignedEngineers.forEach(engineer => {
      engineer.skills.forEach(skill => {
        availableSkills.add(skill.toLowerCase());
      });
    });

    // Find missing skills (case-insensitive comparison)
    const missingSkills = requiredSkills.filter(requiredSkill => 
      !Array.from(availableSkills).some(availableSkill => 
        availableSkill === requiredSkill.toLowerCase()
      )
    );

    // Calculate skill coverage percentage
    const skillCoverage = requiredSkills.length > 0 
      ? Math.round(((requiredSkills.length - missingSkills.length) / requiredSkills.length) * 100)
      : 100;

    res.json({
      projectId,
      projectName: project.name,
      requiredSkills,
      assignedEngineers,
      availableSkills: Array.from(availableSkills),
      missingSkills,
      skillCoverage
    });
  } catch (error) {
    console.error('Get skill gap error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get project status distribution
 * Returns count of projects by status for dashboard charts
 */
const getProjectStatusDistribution = async (req, res) => {
  try {
    const statusCounts = await Project.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    // Match schema statuses:
    const allStatuses = ['planning', 'active', 'completed', 'on-hold'];
    const distribution = allStatuses.map(status => {
      const found = statusCounts.find(item => item._id === status);
      return { status, count: found ? found.count : 0 };
    });
    res.json(distribution);
  } catch (error) {
    console.error('Get project status distribution error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


/**
 * Get skill distribution across all engineers
 * Returns skills and their frequency for insights
 */
const getSkillDistribution = async (req, res) => {
  try {
    const engineers = await User.find({ role: 'engineer' }).select('skills');
    
    // Count skill occurrences
    const skillCounts = {};
    engineers.forEach(engineer => {
      if (engineer.skills) {
        engineer.skills.forEach(skill => {
          const normalizedSkill = skill.trim();
          skillCounts[normalizedSkill] = (skillCounts[normalizedSkill] || 0) + 1;
        });
      }
    });

    // Convert to array and sort by count
    const skillDistribution = Object.entries(skillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count);

    res.json(skillDistribution);
  } catch (error) {
    console.error('Get skill distribution error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getUtilization,
  getSkillGap,
  getProjectStatusDistribution,
  getSkillDistribution
};