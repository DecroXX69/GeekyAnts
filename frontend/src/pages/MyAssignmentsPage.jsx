// File: src/pages/MyAssignmentsPage.jsx
import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import useFetch from '../hooks/useFetch'
import { formatDate } from '../utils/dateUtils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorAlert from '@/components/ErrorAlert'
import AssignmentTimeline from '@/components/AssignmentTimeline'

/**
 * MyAssignmentsPage: Engineer's view of their current assignments
 * Route: /dashboard/assignments (for engineer role)
 * Displays current user's assignments with project details and timeline
 */
const MyAssignmentsPage = () => {
  const { user } = useContext(AuthContext)
  
  // Fetch assignments for current user
  const { data: assignments, loading, error, refetch } = useFetch(
    user?._id ? `/assignments?engineerId=${user._id}` : null,
    [user?._id]
  )

  // Status badge color mapping
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'planning':
        return 'secondary'
      case 'active':
        return 'default'
      case 'completed':
        return 'outline'
      case 'on-hold':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  // Calculate assignment status based on dates
  const getAssignmentStatus = (startDate, endDate) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (now < start) return 'upcoming'
    if (now > end) return 'completed'
    return 'active'
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorAlert message={error} />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Assignments</h1>
          <p className="text-gray-600 mt-2">
            View your current and upcoming project assignments
          </p>
        </div>
      </div>

      {/* Assignments Timeline */}
      {assignments && assignments.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Assignment Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <AssignmentTimeline assignments={assignments} />
          </CardContent>
        </Card>
      )}

      {/* Assignments List */}
      {assignments && assignments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map(assignment => (
            <Card key={assignment._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    {assignment.projectId ? (
                      <Link 
                        to={`/dashboard/projects/${assignment.projectId._id}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {assignment.projectId.name}
                      </Link>
                    ) : (
                      <span className="text-gray-400 italic">Project not available</span>
                    )}
                  </CardTitle>
                  {assignment.projectId?.status ? (
                    <Badge variant={getStatusBadgeVariant(assignment.projectId.status)}>
                      {assignment.projectId.status}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Unknown</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Assignment Details */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Role:</span>
                    <span className="text-sm font-medium">{assignment.role}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Allocation:</span>
                    <span className="text-sm font-medium">{assignment.allocationPercentage}%</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="text-sm font-medium">
                      {formatDate(assignment.startDate)} - {formatDate(assignment.endDate)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge 
                      variant={getAssignmentStatus(assignment.startDate, assignment.endDate) === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {getAssignmentStatus(assignment.startDate, assignment.endDate)}
                    </Badge>
                  </div>
                </div>

                {/* Project Manager */}
                {assignment.projectId?.managerId?.name ? (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Manager:</span>
                    <span className="text-sm font-medium">{assignment.projectId.managerId.name}</span>
                  </div>
                ) : null}

                {/* Project Priority */}
                {assignment.projectId?.priority && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Priority:</span>
                    <Badge 
                      variant={
                        assignment.projectId.priority === 'high' ? 'destructive' : 
                        assignment.projectId.priority === 'medium' ? 'default' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {assignment.projectId.priority}
                    </Badge>
                  </div>
                )}

                {/* Project Description */}
                {assignment.projectId?.description && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {assignment.projectId.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Assignments Found
            </h3>
            <p className="text-gray-600 mb-4">
              You don't have any current assignments. Check back later or contact your manager.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="mt-8 text-center">
        <button
          onClick={refetch}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Refresh Assignments
        </button>
      </div>
    </div>
  )
}

export default MyAssignmentsPage