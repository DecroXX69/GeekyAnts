// skillMatchingService.js
const User = require('../models/User');
const { getAvailableCapacity } = require('./capacityService');

/**
 * Find engineers whose skills match project requirements
 * @param {string[]} requiredSkills - Array of required skill names
 * @param {number} minCapacity - Minimum available capacity required (optional)
 * @returns {Promise<Object[]>} Array of matching engineers with match details
 */
const findMatchingEngineers = async (requiredSkills, minCapacity = 0) => {
  // Step 1: Fetch all engineers
  const engineers = await User.find({ role: 'engineer' });
  
  const matches = [];

  // Step 2: Check each engineer's skill match and capacity
  for (const engineer of engineers) {
    const engineerSkills = engineer.skills || [];
    
    // Calculate skill matching
    const matchingSkills = requiredSkills.filter(skill => 
      engineerSkills.some(engineerSkill => 
        engineerSkill.toLowerCase() === skill.toLowerCase()
      )
    );
    
    const missingSkills = requiredSkills.filter(skill => 
      !engineerSkills.some(engineerSkill => 
        engineerSkill.toLowerCase() === skill.toLowerCase()
      )
    );

    const matchScore = requiredSkills.length > 0 
      ? (matchingSkills.length / requiredSkills.length) * 100 
      : 100;

    // Get available capacity
    const availableCapacity = await getAvailableCapacity(engineer._id.toString());

    // Include if meets minimum capacity requirement
    if (availableCapacity >= minCapacity) {
      matches.push({
        engineer,
        matchingSkills,
        missingSkills,
        availableCapacity,
        matchScore
      });
    }
  }

  // Step 3: Sort by match score (highest first) and then by available capacity
  return matches.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return b.availableCapacity - a.availableCapacity;
  });
};

/**
 * Filter engineers by specific skills
 * @param {string[]} skills - Array of skill names to filter by
 * @returns {Promise<Object[]>} Array of engineers who have at least one of the specified skills
 */
const filterEngineersBySkills = async (skills) => {
  if (!skills || skills.length === 0) {
    return User.find({ role: 'engineer' });
  }

  // Use case-insensitive regex matching for flexibility
  const skillRegexes = skills.map(skill => new RegExp(skill, 'i'));
  
  return User.find({
    role: 'engineer',
    skills: { $in: skillRegexes }
  });
};

/**
 * Get all unique skills across all engineers
 * @returns {Promise<string[]>} Array of unique skill names
 */
const getAllSkills = async () => {
  const engineers = await User.find({ role: 'engineer' }, 'skills');
  
  const allSkills = engineers.reduce((skills, engineer) => {
    if (engineer.skills) {
      skills.push(...engineer.skills);
    }
    return skills;
  }, []);

  // Return unique skills, case-insensitive
  const uniqueSkills = Array.from(new Set(
    allSkills.map(skill => skill.toLowerCase())
  )).map(skill => 
    // Find original casing from the first occurrence
    allSkills.find(originalSkill => 
      originalSkill.toLowerCase() === skill
    ) || skill
  );

  return uniqueSkills.sort();
};

module.exports = {
  findMatchingEngineers,
  filterEngineersBySkills,
  getAllSkills
};