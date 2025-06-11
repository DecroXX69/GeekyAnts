// File: src/pages/ProjectFormPage.jsx
/**
 * ProjectFormPage: Form to create or edit projects
 * Route: /dashboard/projects/new (create) or /dashboard/projects/:id/edit (edit)
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorAlert from '@/components/ErrorAlert'

const ProjectFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [engineers, setEngineers] = useState([])
  const [availableSkills, setAvailableSkills] = useState([])
  const [selectedSkills, setSelectedSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      teamSize: 1,
      status: 'planning'
    }
  })

  const startDate = watch('startDate')
  const endDate = watch('endDate')

  // Fetch engineers to derive available skills
  useEffect(() => {
    const fetchEngineers = async () => {
      try {
        const response = await axiosClient.get('/engineers')
        setEngineers(response.data)
        
        // Extract unique skills from all engineers
        const skills = new Set()
        response.data.forEach(engineer => {
          engineer.skills?.forEach(skill => skills.add(skill))
        })
        setAvailableSkills(Array.from(skills))
      } catch (err) {
        console.error('Failed to fetch engineers:', err)
      }
    }
    fetchEngineers()
  }, [])

  // Fetch project data for editing
  useEffect(() => {
    if (isEdit) {
      const fetchProject = async () => {
        setLoading(true)
        try {
          const response = await axiosClient.get(`/projects/${id}`)
          const project = response.data
          
          // Populate form fields
          reset({
            name: project.name,
            description: project.description,
            startDate: formatDateForInput(project.startDate),
            endDate: formatDateForInput(project.endDate),
            teamSize: project.teamSize,
            status: project.status
          })
          
          // Set selected skills
          setSelectedSkills(project.requiredSkills || [])
        } catch (err) {
          setError('Failed to load project data')
        } finally {
          setLoading(false)
        }
      }
      fetchProject()
    }
  }, [id, isEdit, reset])

  // Add skill to selected skills
  const addSkill = (skill) => {
    if (skill && !selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill])
    }
  }

  // Remove skill from selected skills
  const removeSkill = (skillToRemove) => {
    setSelectedSkills(selectedSkills.filter(skill => skill !== skillToRemove))
  }

  // Add new custom skill
  const addNewSkill = () => {
    if (newSkill.trim() && !selectedSkills.includes(newSkill.trim())) {
      setSelectedSkills([...selectedSkills, newSkill.trim()])
      setNewSkill('')
    }
  }

  // Form submission handler
  const onSubmit = async (data) => {
    // Validate end date is after start date
    if (new Date(data.endDate) <= new Date(data.startDate)) {
      setError('End date must be after start date')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const projectData = {
        ...data,
        requiredSkills: selectedSkills,
        teamSize: parseInt(data.teamSize)
      }

      if (isEdit) {
        await axiosClient.put(`/projects/${id}`, projectData)
        navigate(`/dashboard/projects/${id}`)
      } else {
        await axiosClient.post('/projects', projectData)
        navigate('/dashboard/projects')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save project')
    } finally {
      setLoading(false)
    }
  }

  if (loading && isEdit) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEdit ? 'Edit Project' : 'Create New Project'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && <ErrorAlert message={error} />}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Project Name */}
            <div>
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Project name is required' })}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register('description', { required: 'Description is required' })}
                className={errors.description ? 'border-red-500' : ''}
                rows={4}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate', { required: 'Start date is required' })}
                  className={errors.startDate ? 'border-red-500' : ''}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate', { required: 'End date is required' })}
                  className={errors.endDate ? 'border-red-500' : ''}
                  min={startDate}
                />
                {errors.endDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            {/* Required Skills */}
            <div>
              <Label>Required Skills</Label>
              
              {/* Skills Selection */}
              <div className="mt-2">
                <Select onValueChange={addSkill}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select skills from existing..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSkills.map(skill => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Add Custom Skill */}
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add custom skill..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addNewSkill())}
                />
                <Button type="button" onClick={addNewSkill} variant="outline">
                  Add
                </Button>
              </div>

              {/* Selected Skills */}
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedSkills.map(skill => (
                  <Badge key={skill} variant="secondary" className="cursor-pointer">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Team Size and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="teamSize">Team Size *</Label>
                <Input
                  id="teamSize"
                  type="number"
                  min="1"
                  {...register('teamSize', { 
                    required: 'Team size is required',
                    min: { value: 1, message: 'Team size must be at least 1' }
                  })}
                  className={errors.teamSize ? 'border-red-500' : ''}
                />
                {errors.teamSize && (
                  <p className="text-red-500 text-sm mt-1">{errors.teamSize.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select onValueChange={(value) => setValue('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/dashboard/projects')}
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

export default ProjectFormPage