// src/components/CapacityBar.jsx
import React from 'react'

/**
 * CapacityBar: Visual representation of allocated vs max capacity
 * @param {number} allocated - Current allocated capacity percentage
 * @param {number} maxCapacity - Maximum capacity percentage
 * @param {string} className - Additional CSS classes
 */
const CapacityBar = ({ allocated, maxCapacity, className = '' }) => {
  const percent = maxCapacity > 0 ? (allocated / maxCapacity) * 100 : 0
  const safePercent = Math.min(percent, 100)
  const isOverAllocated = percent > 100
  const isHighUtilization = percent > 90
  
  // Determine bar color based on utilization
  let barColor = 'bg-green-500'
  if (isOverAllocated) {
    barColor = 'bg-red-500'
  } else if (isHighUtilization) {
    barColor = 'bg-yellow-500'
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>Allocated: {allocated}%</span>
        <span>Max: {maxCapacity}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 relative">
        <div
          className={`h-4 rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${safePercent}%` }}
          title={`${allocated}% allocated of ${maxCapacity}% capacity${isOverAllocated ? ' (Over-allocated!)' : ''}`}
        />
        {isOverAllocated && (
          <div className="absolute top-0 right-0 h-4 w-2 bg-red-600 rounded-r-full opacity-75" />
        )}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Available: {Math.max(0, maxCapacity - allocated)}%
      </div>
    </div>
  )
}

export default CapacityBar