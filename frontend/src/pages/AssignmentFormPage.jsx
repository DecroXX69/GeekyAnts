// File: src/pages/AssignmentFormPage.jsx
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../api/axiosClient'
import { formatDateForInput } from '../utils/dateUtils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorAlert from '@/components/ErrorAlert'

/**
 * AssignmentFormPage: Create new assignment form
 * Route: /dashboard/assignments/new
 * Handles engineer/project selection, capacity validation, and date bounds
 */
const AssignmentFormPage = () => {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm()

  // State for dropdowns and validation
  const [engineers, setEngineers] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedEngineer, setSelectedEngineer] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [engineerCapacity, setEngineerCapacity] = useState(null)
  const [projectDetails, setProjectDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Watch form values for validation
  const watchedEngineerId = watch('engineerId')
  const watchedProjectId = watch('projectId')

  // Fetch engineers and projects on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch engineers and active/planning projects
        const [engineersRes, projectsRes] = await Promise.all([
          axiosClient.get('/engineers'),
          axiosClient.get('/projects?status=planning,active')
        ])
        
        setEngineers(engineersRes.data)
        setProjects(projectsRes.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch engineer capacity when engineer is selected
  useEffect(() => {
    const fetchEngineerCapacity = async () => {
      if (watchedEngineerId) {
        try {
          const response = await axiosClient.get(`/engineers/${watchedEngineerId}/capacity`)
          setEngineerCapacity(response.data)
          setSelectedEngineer(engineers.find(e => e._id === watchedEngineerId))
        } catch (err) {
          console.error('Failed to fetch engineer capacity:', err)
          setEngineerCapacity(null)
        }
      } else {
        setEngineerCapacity(null)
        setSelectedEngineer(null)
      }
    }

    fetchEngineerCapacity()
  }, [watchedEngineerId, engineers])

  // Fetch project details when project is selected
  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (watchedProjectId) {
        try {
          const response = await axiosClient.get(`/projects/${watchedProjectId}`)
          setProjectDetails(response.data)
          setSelectedProject(projects.find(p => p._id === watchedProjectId))
        } catch (err) {
          console.error('Failed to fetch project details:', err)
          setProjectDetails(null)
        }
      } else {
        setProjectDetails(null)
        setSelectedProject(null)
      }
    }

    fetchProjectDetails()
  }, [watchedProjectId, projects])

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      // Client-side validation
      if (!data.engineerId || !data.projectId) {
        setError('Engineer and Project are required')
        return
      }

      if (engineerCapacity && data.allocationPercentage > engineerCapacity.availableCapacity) {
        setError(`Allocation percentage cannot exceed available capacity (${engineerCapacity.availableCapacity}%)`)
        return
      }

      if (new Date(data.endDate) <= new Date(data.startDate)) {
        setError('End date must be after start date')
        return
      }

      // Validate dates are within project bounds
      if (projectDetails) {
        const projectStart = new Date(projectDetails.startDate)
        const projectEnd = new Date(projectDetails.endDate)
        const assignmentStart = new Date(data.startDate)
        const assignmentEnd = new Date(data.endDate)

        if (assignmentStart < projectStart || assignmentEnd > projectEnd) {
          setError('Assignment dates must be within project timeline')
          return
        }
      }

      // Submit assignment
      await axiosClient.post('/assignments', {
        engineerId: data.engineerId,
        projectId: data.projectId,
        allocationPercentage: parseInt(data.allocationPercentage),
        startDate: data.startDate,
        endDate: data.endDate,
        role: data.role
      })

      // Navigate to assignments list on success
      navigate('/dashboard/assignments')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create assignment')
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <ErrorAlert message={error} className="mb-4" />}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Engineer Selection */}
            <div className="space-y-2">
              <Label htmlFor="engineerId">Engineer *</Label>
              <Select onValueChange={(value) => setValue('engineerId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an engineer" />
                </SelectTrigger>
                <SelectContent>
                  {engineers.map(engineer => (
                    <SelectItem key={engineer._id} value={engineer._id}>
                      {engineer.name} - {engineer.seniority || 'N/A'} ({engineer.skills?.join(', ') || 'No skills listed'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.engineerId && (
                <p className="text-sm text-red-600">Engineer is required</p>
              )}
            </div>

            {/* Engineer Capacity Display */}
            {engineerCapacity && (
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  Available Capacity: <span className="font-semibold">{engineerCapacity.availableCapacity}%</span>
                  {' '}(Max: {engineerCapacity.maxCapacity}%, Allocated: {engineerCapacity.allocatedCapacity}%)
                </p>
              </div>
            )}

            {/* Project Selection */}
            <div className="space-y-2">
              <Label htmlFor="projectId">Project *</Label>
              <Select onValueChange={(value) => setValue('projectId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project._id} value={project._id}>
                      {project.name} - {project.status} ({project.priority || 'Medium'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && (
                <p className="text-sm text-red-600">Project is required</p>
              )}
            </div>

            {/* Project Timeline Display */}
            {projectDetails && (
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  Project Timeline: {formatDateForInput(projectDetails.startDate)} to {formatDateForInput(projectDetails.endDate)}
                </p>
              </div>
            )}

            {/* Allocation Percentage */}
            <div className="space-y-2">
              <Label htmlFor="allocationPercentage">Allocation Percentage *</Label>
              <Input
                type="number"
                min="1"
                max={engineerCapacity?.availableCapacity || 100}
                {...register('allocationPercentage', {
                  required: 'Allocation percentage is required',
                  min: { value: 1, message: 'Minimum allocation is 1%' },
                  max: {
                    value: engineerCapacity?.availableCapacity || 100,
                    message: `Maximum allocation is ${engineerCapacity?.availableCapacity || 100}%`
                  }
                })}
                placeholder="Enter allocation percentage"
              />
              {errors.allocationPercentage && (
                <p className="text-sm text-red-600">{errors.allocationPercentage.message}</p>
              )}
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                type="date"
                {...register('startDate', {
                  required: 'Start date is required'
                })}
                min={projectDetails ? formatDateForInput(projectDetails.startDate) : undefined}
                max={projectDetails ? formatDateForInput(projectDetails.endDate) : undefined}
              />
              {errors.startDate && (
                <p className="text-sm text-red-600">{errors.startDate.message}</p>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                type="date"
                {...register('endDate', {
                  required: 'End date is required'
                })}
                min={projectDetails ? formatDateForInput(projectDetails.startDate) : undefined}
                max={projectDetails ? formatDateForInput(projectDetails.endDate) : undefined}
              />
              {errors.endDate && (
                <p className="text-sm text-red-600">{errors.endDate.message}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Input
                type="text"
                {...register('role', {
                  required: 'Role is required'
                })}
                placeholder="e.g., Frontend Developer, Backend Engineer"
              />
              {errors.role && (
                <p className="text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Creating...' : 'Create Assignment'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/assignments')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AssignmentFormPage