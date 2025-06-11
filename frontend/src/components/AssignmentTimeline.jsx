// src/components/AssignmentTimeline.jsx
import React from 'react'
import { parseISO, differenceInDays, format } from 'date-fns'

/**
 * AssignmentTimeline: Visual timeline showing assignment periods
 * @param {array} assignments - Array of assignment objects with startDate, endDate, project info
 */
const AssignmentTimeline = ({ assignments }) => {
  if (!assignments || assignments.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
        No assignments to display
      </div>
    )
  }

  // Calculate timeline bounds - find earliest start and latest end dates
  const dates = assignments.flatMap(a => [
    parseISO(a.startDate), 
    parseISO(a.endDate)
  ])
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
  const totalDays = Math.max(differenceInDays(maxDate, minDate), 1)

  // Generate unique colors for different projects
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 
    'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-yellow-500'
  ]
  const projectColors = {}
  assignments.forEach((assignment, index) => {
    const projectId = assignment.projectId || assignment.project?._id
    if (!projectColors[projectId]) {
      projectColors[projectId] = colors[Object.keys(projectColors).length % colors.length]
    }
  })

  return (
    <div className="w-full">
      <h4 className="text-lg font-semibold mb-4">Assignment Timeline</h4>
      
      {/* Timeline container */}
      <div className="relative bg-gray-50 rounded-lg p-4 overflow-x-auto">
        <div className="relative h-20 min-w-full">
          {assignments.map((assignment, index) => {
            const start = parseISO(assignment.startDate)
            const end = parseISO(assignment.endDate)
            const offsetDays = differenceInDays(start, minDate)
            const durationDays = Math.max(differenceInDays(end, start), 1)
            
            // Calculate position and width as percentages
            const leftPercent = (offsetDays / totalDays) * 100
            const widthPercent = (durationDays / totalDays) * 100
            
            const projectId = assignment.projectId || assignment.project?._id
            const projectName = assignment.project?.name || `Project ${projectId}`
            const bgColor = projectColors[projectId] || colors[0]

            return (
              <div
                key={index}
                className={`absolute top-4 h-12 ${bgColor} rounded shadow-sm border-2 border-white cursor-pointer hover:shadow-md transition-shadow`}
                style={{ 
                  left: `${leftPercent}%`, 
                  width: `${Math.max(widthPercent, 2)}%` // Minimum width for visibility
                }}
                title={`${projectName}: ${assignment.allocationPercentage}% allocation\n${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`}
              >
                <div className="p-2 text-white text-xs font-medium truncate">
                  <div className="truncate">{projectName}</div>
                  <div className="text-white/80">{assignment.allocationPercentage}%</div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Date labels */}
        <div className="flex justify-between text-xs text-gray-600 mt-2 pt-2 border-t">
          <span>{format(minDate, 'MMM d, yyyy')}</span>
          <span>{format(maxDate, 'MMM d, yyyy')}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">Projects:</h5>
        <div className="flex flex-wrap gap-2">
          {Object.entries(projectColors).map(([projectId, color]) => {
            const assignment = assignments.find(a => 
              (a.projectId || a.project?._id) === projectId
            )
            const projectName = assignment?.project?.name || `Project ${projectId}`
            
            return (
              <div key={projectId} className="flex items-center gap-2">
                <div className={`w-4 h-4 ${color} rounded`}></div>
                <span className="text-sm text-gray-700">{projectName}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AssignmentTimeline