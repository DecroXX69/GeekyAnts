// File: src/pages/ProjectsListPage.jsx
/**
 * ProjectsListPage: Manager view to list and filter projects
 * with status and date range filters
 */
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorAlert from '@/components/ErrorAlert'
import SkillTag from '@/components/SkillTag'
import { formatDate, formatDateForInput } from '../utils/dateUtils'
import axiosClient from '../api/axiosClient'

const ProjectsListPage = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'on-hold', label: 'On Hold' }
  ]

  // Fetch projects with current filters
  const fetchProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      // Build query parameters
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (startDateFilter) params.append('startDate', startDateFilter)
      if (endDateFilter) params.append('endDate', endDateFilter)
      
      const queryString = params.toString()
      const url = `/projects${queryString ? `?${queryString}` : ''}`
      
      const response = await axiosClient.get(url)
      setProjects(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch and refetch when filters change
  useEffect(() => {
    fetchProjects()
  }, [statusFilter, startDateFilter, endDateFilter])

  // Get status badge styling
  const getStatusBadge = (status) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium'
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

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} />

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Link to="/dashboard/projects/new">
          <Button>Create New Project</Button>
        </Link>
      </div>

      {/* Filters Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date Filter */}
            <div>
              <Label htmlFor="start-date-filter">Start Date From</Label>
              <Input
                id="start-date-filter"
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
              />
            </div>

            {/* End Date Filter */}
            <div>
              <Label htmlFor="end-date-filter">End Date To</Label>
              <Input
                id="end-date-filter"
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {(statusFilter || startDateFilter || endDateFilter) && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setStatusFilter('')
                  setStartDateFilter('')
                  setEndDateFilter('')
                }}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <Card key={project._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="truncate">{project.name}</span>
                <span className={getStatusBadge(project.status)}>
                  {project.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Project Description */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {project.description}
              </p>

              {/* Dates */}
              <div className="mb-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Start:</span> {formatDate(project.startDate)}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">End:</span> {formatDate(project.endDate)}
                </div>
              </div>

              {/* Required Skills */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {project.requiredSkills && project.requiredSkills.length > 0 ? (
                    project.requiredSkills.map(skill => (
                      <SkillTag key={skill} skill={skill} />
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No skills specified</span>
                  )}
                </div>
              </div>

              {/* Team Size and Manager */}
              <div className="mb-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Team Size:</span> {project.teamSize}
                </div>
                {project.manager && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Manager:</span> {project.manager.name}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Link to={`/dashboard/projects/${project._id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
                <Link to={`/dashboard/projects/${project._id}/edit`} className="flex-1">
                  <Button className="w-full">
                    Edit
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {projects.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500 mb-4">
              {statusFilter || startDateFilter || endDateFilter
                ? 'No projects found matching the current filters.'
                : 'No projects found.'
              }
            </p>
            <Link to="/dashboard/projects/new">
              <Button>Create Your First Project</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ProjectsListPage