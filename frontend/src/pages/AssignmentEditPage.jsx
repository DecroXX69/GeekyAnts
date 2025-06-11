// File: src/pages/AssignmentEditPage.jsx
/**
 * AssignmentEditPage: Edit existing assignment
 * Route: /dashboard/assignments/:id/edit
 */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorAlert from '@/components/ErrorAlert'

const AssignmentEditPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // State for overall loading, submission loading, error messages, lists and capacity
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState(null)
  const [engineers, setEngineers] = useState([])
  const [projects, setProjects] = useState([])
  const [engineerCapacity, setEngineerCapacity] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)

  // Setup react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    trigger
  } = useForm({
    defaultValues: {
      engineerId: '',
      projectId: '',
      allocationPercentage: '',
      startDate: '',
      endDate: '',
      role: ''
    }
  })

  // Watch form fields for side-effects
  const watchedEngineerId = watch('engineerId')
  const watchedProjectId = watch('projectId')
  const watchedStartDate = watch('startDate')
  const watchedEndDate = watch('endDate')

  // Fetch initial data: assignment details, engineer list, project list
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch the assignment by id. Assuming backend provides GET /assignments/:id or fallback to query:
        // Here we try GET /assignments/:id; if not available, fallback to GET /assignments?engineerId=&projectId= array.
        let assignmentData = null
        try {
          const res = await axiosClient.get(`/assignments/${id}`)
          assignmentData = res.data
        } catch {
          // Fallback: GET all and find by id
          const resAll = await axiosClient.get(`/assignments?engineerId=&projectId=`)
          assignmentData = resAll.data.find(a => a._id === id)
        }
        if (!assignmentData) {
          throw new Error('Assignment not found')
        }
        // Fetch engineers and projects lists in parallel
        const [engineersRes, projectsRes] = await Promise.all([
          axiosClient.get('/engineers'),
          axiosClient.get('/projects')
        ])
        setEngineers(engineersRes.data)
        setProjects(projectsRes.data)

        // Populate form with assignment data; format dates for input value
        reset({
          engineerId: assignmentData.engineer._id,
          projectId: assignmentData.project._id,
          allocationPercentage: assignmentData.allocationPercentage,
          startDate: formatDateForInput(assignmentData.startDate),
          endDate: formatDateForInput(assignmentData.endDate),
          role: assignmentData.role || ''
        })
        // Set selected project object
        setSelectedProject(assignmentData.project)
      } catch (err) {
        console.error(err)
        setError('Failed to load assignment data')
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [id, reset])

  // Fetch engineer capacity whenever engineer selection changes
  useEffect(() => {
    if (watchedEngineerId) {
      const fetchCapacity = async () => {
        try {
          // Fetch capacity for selected engineer
          const response = await axiosClient.get(`/engineers/${watchedEngineerId}/capacity`)
          setEngineerCapacity(response.data)
          // Trigger validation for allocationPercentage in case max changed
          trigger('allocationPercentage')
        } catch (err) {
          console.error('Failed to fetch engineer capacity:', err)
          setEngineerCapacity(null)
        }
      }
      fetchCapacity()
    } else {
      setEngineerCapacity(null)
    }
  }, [watchedEngineerId, trigger])

  // Update selectedProject object when project selection changes
  useEffect(() => {
    if (watchedProjectId && projects.length) {
      const proj = projects.find(p => p._id === watchedProjectId)
      setSelectedProject(proj || null)
    } else {
      setSelectedProject(null)
    }
  }, [watchedProjectId, projects])

  // Form submission handler
  const onSubmit = async (data) => {
    setError(null)
    // Validate required selections manually if needed
    if (!data.engineerId) {
      setError('Engineer is required')
      return
    }
    if (!data.projectId) {
      setError('Project is required')
      return
    }
    // Validate allocation doesn't exceed available capacity
    if (engineerCapacity && parseInt(data.allocationPercentage, 10) > engineerCapacity.availableCapacity) {
      setError(`Allocation cannot exceed available capacity (${engineerCapacity.availableCapacity}%)`)
      return
    }
    // Validate dates are provided
    if (!data.startDate || !data.endDate) {
      setError('Start date and end date are required')
      return
    }
    // Validate dates order
    const assignmentStart = new Date(data.startDate)
    const assignmentEnd = new Date(data.endDate)
    if (assignmentEnd <= assignmentStart) {
      setError('End date must be after start date')
      return
    }
    // Validate dates within project bounds
    if (selectedProject) {
      const projectStart = new Date(selectedProject.startDate)
      const projectEnd = new Date(selectedProject.endDate)
      if (assignmentStart < projectStart || assignmentEnd > projectEnd) {
        setError('Assignment dates must be within project date range')
        return
      }
    }
    setSubmitLoading(true)
    try {
      // Prepare payload
      const payload = {
        engineerId: data.engineerId,
        projectId: data.projectId,
        allocationPercentage: parseInt(data.allocationPercentage, 10),
        startDate: data.startDate,
        endDate: data.endDate,
        role: data.role
      }
      // Send update request
      await axiosClient.put(`/assignments/${id}`, payload)
      // On success, navigate back to assignments list
      navigate('/dashboard/assignments')
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Failed to update assignment')
    } finally {
      setSubmitLoading(false)
    }
  }

  if (loading) {
    // Show loading spinner while fetching initial data
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Display any top-level error */}
          {error && <ErrorAlert message={error} />}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Engineer Selection */}
            <div>
              <Label htmlFor="engineerId">Engineer *</Label>
              <Select
                value={watchedEngineerId}
                onValueChange={(value) => {
                  setValue('engineerId', value, { shouldValidate: true })
                }}
              >
                <SelectTrigger
                  id="engineerId"
                  className={errors.engineerId ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="Select engineer..." />
                </SelectTrigger>
                <SelectContent>
                  {engineers.map(engineer => (
                    <SelectItem key={engineer._id} value={engineer._id}>
                      {engineer.name} ({engineer.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.engineerId && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.engineerId.message || 'Engineer is required'}
                </p>
              )}
            </div>

            {/* Engineer Capacity Info */}
            {engineerCapacity && (
              <Alert variant="default">
                <AlertDescription>
                  <strong>Engineer Capacity:</strong> {engineerCapacity.availableCapacity}% available (
                  {engineerCapacity.allocatedCapacity}% of {engineerCapacity.maxCapacity}% allocated)
                </AlertDescription>
              </Alert>
            )}

            {/* Project Selection */}
            <div>
              <Label htmlFor="projectId">Project *</Label>
              <Select
                value={watchedProjectId}
                onValueChange={(value) => {
                  setValue('projectId', value, { shouldValidate: true })
                }}
              >
                <SelectTrigger
                  id="projectId"
                  className={errors.projectId ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project._id} value={project._id}>
                      {project.name} ({project.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.projectId.message || 'Project is required'}
                </p>
              )}
            </div>

            {/* Project Date Bounds Info */}
            {selectedProject && (
              <Alert variant="default">
                <AlertDescription>
                  <strong>Project Duration:</strong>{' '}
                  {new Date(selectedProject.startDate).toLocaleDateString()} -{' '}
                  {new Date(selectedProject.endDate).toLocaleDateString()}
                </AlertDescription>
              </Alert>
            )}

            {/* Allocation Percentage */}
            <div>
              <Label htmlFor="allocationPercentage">Allocation Percentage *</Label>
              <Input
                id="allocationPercentage"
                type="number"
                min="1"
                max={engineerCapacity ? engineerCapacity.availableCapacity : 100}
                {...register('allocationPercentage', {
                  required: 'Allocation percentage is required',
                  min: { value: 1, message: 'Allocation must be at least 1%' },
                  max: {
                    value: engineerCapacity ? engineerCapacity.availableCapacity : 100,
                    message: `Allocation cannot exceed ${engineerCapacity ? engineerCapacity.availableCapacity : 100}%`
                  }
                })}
                className={errors.allocationPercentage ? 'border-red-500' : ''}
              />
              {errors.allocationPercentage && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.allocationPercentage.message}
                </p>
              )}
            </div>

            {/* Start Date */}
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate', {
                  required: 'Start date is required'
                })}
                className={errors.startDate ? 'border-red-500' : ''}
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            {/* End Date */}
            <div>
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate', {
                  required: 'End date is required'
                })}
                className={errors.endDate ? 'border-red-500' : ''}
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.endDate.message}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <Label htmlFor="role">Role *</Label>
              <Input
                id="role"
                type="text"
                placeholder="e.g., Developer, Tech Lead"
                {...register('role', {
                  required: 'Role is required'
                })}
                className={errors.role ? 'border-red-500' : ''}
              />
              {errors.role && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.role.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button type="submit" disabled={submitLoading}>
                {submitLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" /> Saving...
                  </>
                ) : (
                  'Update Assignment'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AssignmentEditPage
