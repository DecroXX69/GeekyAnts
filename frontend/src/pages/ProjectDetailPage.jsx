// File: src/pages/ProjectDetailPage.jsx
/**
 * ProjectDetailPage: Show project full details and its assignments
 * with ability to manage assignments for managers
 */
import React, { useState, useEffect, useContext } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorAlert from '@/components/ErrorAlert'
import SkillTag from '@/components/SkillTag'
import { formatDate } from '../utils/dateUtils'
import { AuthContext } from '../context/AuthContext'
import axiosClient from '../api/axiosClient'

const ProjectDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteAssignmentId, setDeleteAssignmentId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch project details
  const fetchProject = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axiosClient.get(`/projects/${id}`)
      setProject(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch project details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProject()
  }, [id])

  // Handle assignment deletion
  const handleDeleteAssignment = async (assignmentId) => {
    setIsDeleting(true)
    try {
      await axiosClient.delete(`/assignments/${assignmentId}`)
      // Refetch project to update assignments list
      await fetchProject()
      setDeleteAssignmentId(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete assignment')
    } finally {
      setIsDeleting(false)
    }
  }

  // Get status badge styling
  const getStatusBadge = (status) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium'
    switch (status) {
      case 'planning':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800`
      case 'on-hold':
        return `${baseClasses} bg-red-100 text-red-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  // Check if user is manager and can manage assignments
  const canManageAssignments = user && user.role === 'manager'

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} />
  if (!project) return <ErrorAlert message="Project not found" />

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/dashboard/projects">
          <Button variant="outline">← Back to Projects</Button>
        </Link>
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <span className={getStatusBadge(project.status)}>
          {project.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Information */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Description */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{project.description}</p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Start Date</h4>
                    <p className="text-gray-600">{formatDate(project.startDate)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">End Date</h4>
                    <p className="text-gray-600">{formatDate(project.endDate)}</p>
                  </div>
                </div>

                {/* Required Skills */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.requiredSkills && project.requiredSkills.length > 0 ? (
                      project.requiredSkills.map(skill => (
                        <SkillTag key={skill} skill={skill} />
                      ))
                    ) : (
                      <span className="text-gray-500">No skills specified</span>
                    )}
                  </div>
                </div>

                {/* Team Size */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Team Size</h4>
                  <p className="text-gray-600">{project.teamSize} members</p>
                </div>

                {/* Manager Info */}
                {project.manager && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Project Manager</h4>
                    <p className="text-gray-600">{project.manager.name} ({project.manager.email})</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {canManageAssignments && (
                  <>
                    <Link to={`/dashboard/projects/${project._id}/edit`} className="block">
                      <Button className="w-full">Edit Project</Button>
                    </Link>
                    <Link to={`/dashboard/assignments/new?projectId=${project._id}`} className="block">
                      <Button variant="outline" className="w-full">Add Assignment</Button>
                    </Link>
                  </>
                )}
                <Link to="/dashboard/projects" className="block">
                  <Button variant="outline" className="w-full">Back to Projects</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assignments Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Team Assignments</span>
            {canManageAssignments && (
              <Link to={`/dashboard/assignments/new?projectId=${project._id}`}>
                <Button size="sm">Add Assignment</Button>
              </Link>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {project.assignments && project.assignments.length > 0 ? (
            <div className="space-y-4">
              {project.assignments.map(assignment => (
                <div key={assignment._id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {assignment.engineer ? assignment.engineer.name : 'Unknown Engineer'}
                        </h4>
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {assignment.allocationPercentage}% allocated
                        </span>
                        {assignment.role && (
                          <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            {assignment.role}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="mr-4">
                          {formatDate(assignment.startDate)} - {formatDate(assignment.endDate)}
                        </span>
                        {assignment.engineer && assignment.engineer.email && (
                          <span>{assignment.engineer.email}</span>
                        )}
                      </div>
                    </div>
                    
                    {canManageAssignments && (
                      <div className="flex gap-2">
                        <Link to={`/dashboard/assignments/${assignment._id}/edit`}>
                          <Button size="sm" variant="outline">Edit</Button>
                        </Link>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => setDeleteAssignmentId(assignment._id)}
                            >
                              Delete
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Assignment</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete this assignment? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDeleteAssignmentId(null)}>
                                Cancel
                              </Button>
                              <Button 
                                variant="destructive" 
                                onClick={() => handleDeleteAssignment(assignment._id)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No assignments yet</p>
              {canManageAssignments && (
                <Link to={`/dashboard/assignments/new?projectId=${project._id}`}>
                  <Button>Create First Assignment</Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ProjectDetailPage