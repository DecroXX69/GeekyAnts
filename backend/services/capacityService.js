// capacityService.js
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const { startOfDay, endOfDay, isAfter, isBefore } = require('date-fns');

/**
 * Calculate available capacity for an engineer within a date range
 * @param {string} engineerId - Engineer's user ID
 * @param {Date} startDate - Optional start date for calculation (defaults to today)
 * @param {Date} endDate - Optional end date for calculation (defaults to far future)
 * @returns {Promise<number>} Available capacity percentage
 */
const getAvailableCapacity =  async (engineerId, startDate, endDate, excludeAssignmentId = null) => {
  // Step 1: Fetch engineer to get max capacity
  const engineer = await User.findById(engineerId);
  if (!engineer || engineer.role !== 'engineer') {
    throw new Error('Engineer not found');
  }

  const maxCapacity = engineer.maxCapacity || 100;
  
  // Step 2: Set default date range if not provided
  const rangeStart = startDate ? startOfDay(startDate) : startOfDay(new Date());
  const rangeEnd = endDate ? endOfDay(endDate) : new Date('2030-12-31');

    const query = {
    engineerId,
    startDate: { $lte: rangeEnd },
    endDate: { $gte: rangeStart }
  };
  if (excludeAssignmentId) {
    query._id = { $ne: excludeAssignmentId };
  }

  // Step 3: Fetch assignments that overlap with the date range
  const overlappingAssignments = await Assignment.find(query);

  // Step 4: Sum allocation percentages from overlapping assignments
  let totalAllocated = 0;
  for (const assignment of overlappingAssignments) {
    // Calculate the overlap duration to determine weighted allocation
    const overlapStart = isAfter(assignment.startDate, rangeStart) 
      ? assignment.startDate 
      : rangeStart;
    const overlapEnd = isBefore(assignment.endDate, rangeEnd) 
      ? assignment.endDate 
      : rangeEnd;
    
    // For simplicity, we'll use the full allocation percentage
    // In a more sophisticated system, we'd weight by overlap duration
    totalAllocated += assignment.allocationPercentage;
  }

  // Step 5: Calculate available capacity
  const availableCapacity = Math.max(0, maxCapacity - totalAllocated);
  
  return availableCapacity;
};

/**
 * Get detailed capacity information for an engineer
 * @param {string} engineerId - Engineer's user ID
 * @returns {Promise<Object>} Capacity information object
 */
const getCapacityInfo = async (engineerId) => {
  const engineer = await User.findById(engineerId);
  if (!engineer || engineer.role !== 'engineer') {
    throw new Error('Engineer not found');
  }

  const maxCapacity = engineer.maxCapacity || 100;
  const availableCapacity = await getAvailableCapacity(engineerId);
  const allocatedCapacity = maxCapacity - availableCapacity;
  const utilizationPercent = (allocatedCapacity / maxCapacity) * 100;

  return {
    engineerId,
    maxCapacity,
    allocatedCapacity,
    availableCapacity,
    utilizationPercent
  };
};

/**
 * Calculate future availability windows for an engineer
 * @param {string} engineerId - Engineer's user ID
 * @returns {Promise<Object[]>} Array of availability windows
 */
const getAvailabilityWindows = async (engineerId) => {
  const engineer = await User.findById(engineerId);
  if (!engineer || engineer.role !== 'engineer') {
    throw new Error('Engineer not found');
  }

  const maxCapacity = engineer.maxCapacity || 100;
  const today = startOfDay(new Date());

  // Fetch all future assignments sorted by start date
  const futureAssignments = await Assignment.find({
    engineerId,
    endDate: { $gte: today }
  }).sort({ startDate: 1 });

  const windows = [];
  
  // Check availability from today until first assignment
  if (futureAssignments.length === 0) {
    // No future assignments, fully available
    windows.push({
      startDate: today,
      endDate: new Date('2030-12-31'),
      availableCapacity: maxCapacity
    });
  } else {
    const firstAssignment = futureAssignments[0];
    if (isAfter(firstAssignment.startDate, today)) {
      // Gap between today and first assignment
      windows.push({
        startDate: today,
        endDate: firstAssignment.startDate,
        availableCapacity: maxCapacity
      });
    }

    // Find gaps between assignments
    for (let i = 0; i < futureAssignments.length - 1; i++) {
      const currentAssignment = futureAssignments[i];
      const nextAssignment = futureAssignments[i + 1];
      
      if (isAfter(nextAssignment.startDate, currentAssignment.endDate)) {
        // Gap found between assignments
        windows.push({
          startDate: currentAssignment.endDate,
          endDate: nextAssignment.startDate,
          availableCapacity: maxCapacity
        });
      }
    }

    // Availability after last assignment
    const lastAssignment = futureAssignments[futureAssignments.length - 1];
    windows.push({
      startDate: lastAssignment.endDate,
      endDate: new Date('2030-12-31'),
      availableCapacity: maxCapacity
    });
  }

  return windows.filter(window => window.availableCapacity > 0);
};

module.exports = {
  getAvailableCapacity,
  getCapacityInfo,
  getAvailabilityWindows
};