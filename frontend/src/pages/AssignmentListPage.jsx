// File: src/pages/AssignmentListPage.jsx
/**
 * AssignmentListPage: Display and manage assignments with filtering
 * Route: /dashboard/assignments
 */
import React, { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import axiosClient from '../api/axiosClient'
import { formatDate } from '../utils/dateUtils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorAlert from '@/components/ErrorAlert'

const AssignmentListPage = () => {
  const { user } = useContext(AuthContext)
  const [assignments, setAssignments] = useState([])
  const [engineers, setEngineers] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(null)
  
  // Filter states
  const [selectedEngineerId, setSelectedEngineerId] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')

  // Fetch initial data for filters
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [engineersRes, projectsRes] = await Promise.all([
          axiosClient.get('/engineers'),
          axiosClient.get('/projects')
        ])
        setEngineers(engineersRes.data)
        setProjects(projectsRes.data)
      } catch (err) {
        console.error('Failed to fetch initial data:', err)
      }
    }
    fetchInitialData()
  }, [])

  // Fetch assignments based on filters
  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const params = new URLSearchParams()
        if (selectedEngineerId) params.append('engineerId', selectedEngineerId)
        if (selectedProjectId) params.append('projectId', selectedProjectId)
        
        const response = await axiosClient.get(`/assignments?${params.toString()}`)
        setAssignments(response.data)
      } catch (err) {
        setError('Failed to load assignments')
      } finally {
        setLoading(false)
      }
    }

    fetchAssignments()
  }, [selectedEngineerId, selectedProjectId])

  // Handle assignment deletion
  const handleDelete = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return
    }

    setDeleteLoading(assignmentId)
    try {
      await axiosClient.delete(`/assignments/${assignmentId}`)
      // Refetch assignments after deletion
      setAssignments(assignments.filter(a => a._id !== assignmentId))
    } catch (err) {
      setError('Failed to delete assignment')
    } finally {
      setDeleteLoading(null)
    }
  }

  // Get status badge variant
  const getStatusVariant = (status) => {
    switch (status) {
      case 'active': return 'default'
      case 'completed': return 'secondary'
      case 'planning': return 'outline'
      case 'on-hold': return 'destructive'
      default: return 'outline'
    }
  }

  const isManager = user?.role === 'manager'

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Assignments</h1>
        {isManager && (
          <Link to="/dashboard/assignments/new">
            <Button>Create Assignment</Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Engineer</label>
              <Select value={selectedEngineerId} onValueChange={setSelectedEngineerId}>
                <SelectTrigger>
                  <SelectValue placeholder="All engineers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All engineers</SelectItem>
                  {engineers.map(engineer => (
                    <SelectItem key={engineer._id} value={engineer._id}>
                      {engineer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Project</label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All projects</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project._id} value={project._id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && <ErrorAlert message={error} />}

      {/* Loading State */}
      {loading && <LoadingSpinner />}

      {/* Assignments List */}
      {!loading && (
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <Alert>
              <AlertDescription>
                No assignments found matching the current filters.
              </AlertDescription>
            </Alert>
          ) : (
            assignments.map(assignment => (
              <Card key={assignment._id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Engineer Info */}
                        <div>
                          <p className="text-sm text-gray-500">Engineer</p>
                          <p className="font-medium">
                            {assignment.engineer?.name || 'Unknown Engineer'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {assignment.engineer?.email}
                          </p>
                        </div>

                        {/* Project Info */}
                        <div>
                          <p className="text-sm text-gray-500">Project</p>
                          <p className="font-medium">
                            {assignment.project?.name || 'Unknown Project'}
                          </p>
                          <Badge variant={getStatusVariant(assignment.project?.status)}>
                            {assignment.project?.status || 'Unknown'}
                          </Badge>
                        </div>

                        {/* Assignment Details */}
                        <div>
                          <p className="text-sm text-gray-500">Allocation & Role</p>
                          <p className="font-medium">{assignment.allocationPercentage}%</p>
                          <p className="text-sm text-gray-600">{assignment.role}</p>
                        </div>

                        {/* Dates */}
                        <div>
                          <p className="text-sm text-gray-500">Duration</p>
                          <p className="text-sm">
                            {formatDate(assignment.startDate)} - {formatDate(assignment.endDate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions (Manager only) */}
                    {isManager && (
                      <div className="flex gap-2 ml-4">
                        <Link to={`/dashboard/assignments/${assignment._id}/edit`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(assignment._id)}
                          disabled={deleteLoading === assignment._id}
                        >
                          {deleteLoading === assignment._id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default AssignmentListPage