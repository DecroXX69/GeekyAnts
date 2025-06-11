// File: src/pages/ProfilePage.jsx
import React, { useState, useEffect, useContext } from 'react'
import { useForm } from 'react-hook-form'
import { AuthContext } from '../context/AuthContext'
import axiosClient from '../api/axiosClient'
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
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorAlert from '@/components/ErrorAlert'

/**
 * ProfilePage: User profile management page
 * Route: /dashboard/profile
 * Allows users to update their profile information including skills, seniority, etc.
 */
const ProfilePage = () => {
  const { user, setUser } = useContext(AuthContext)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [availableSkills, setAvailableSkills] = useState([])
  const [selectedSkills, setSelectedSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm()

  const watchedEmploymentType = watch('employmentType')

  // Fetch profile data and available skills on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch user profile
        const profileRes = await axiosClient.get('/auth/profile')
        const userData = profileRes.data
        
        // Fetch available skills from all engineers
        const engineersRes = await axiosClient.get('/engineers/skills')
setAvailableSkills(engineersRes.data)
        
        // Pre-populate form with user data
        setValue('name', userData.name || '')
        setValue('department', userData.department || '')
        setValue('seniority', userData.seniority || '')
        setValue('employmentType', userData.maxCapacity === 100 ? 'full-time' : 'part-time')
        setSelectedSkills(userData.skills || [])
        
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [setValue])

  // Add skill to selected skills
  const addSkill = (skill) => {
    if (skill && !selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill])
    }
    setNewSkill('')
  }

  // Remove skill from selected skills
  const removeSkill = (skillToRemove) => {
    setSelectedSkills(selectedSkills.filter(skill => skill !== skillToRemove))
  }

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setError(null)
      setSuccess(false)
      
      // Prepare payload
      const updateData = {
        name: data.name,
        department: data.department,
        seniority: data.seniority,
        skills: selectedSkills,
        maxCapacity: data.employmentType === 'full-time' ? 100 : 50
      }

      // Update profile
      const response = await axiosClient.put(`/engineers/${user._id}`, updateData)
      
      // Update user context with new data
      const updatedUser = { ...user, ...response.data }
      setUser(updatedUser)
      
      setSuccess(true)
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <p className="text-gray-600">Update your profile information and skills</p>
        </CardHeader>
        <CardContent>
          {error && <ErrorAlert message={error} className="mb-4" />}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
              <p className="text-green-800 text-sm">Profile updated successfully!</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                {...register('name', {
                  required: 'Name is required'
                })}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                value={user?.email || ''}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                {...register('department')}
                placeholder="e.g., Engineering, Product, Design"
              />
            </div>

            {/* Seniority */}
            <div className="space-y-2">
              <Label htmlFor="seniority">Seniority Level</Label>
              <Select onValueChange={(value) => setValue('seniority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select seniority level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="mid">Mid-level</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Employment Type */}
            <div className="space-y-2">
              <Label htmlFor="employmentType">Employment Type</Label>
              <Select onValueChange={(value) => setValue('employmentType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time (100% capacity)</SelectItem>
                  <SelectItem value="part-time">Part-time (50% capacity)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <Label>Skills</Label>
              
              {/* Current Skills Display */}
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedSkills.map(skill => (
                  <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-600" 
                      onClick={() => removeSkill(skill)}
                    />
                  </Badge>
                ))}
              </div>

              {/* Add New Skill */}
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkill(newSkill)
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addSkill(newSkill)}
                  disabled={!newSkill}
                >
                  Add
                </Button>
              </div>

              {/* Available Skills Suggestions */}
              {availableSkills.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">Suggested skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {availableSkills
                      .filter(skill => !selectedSkills.includes(skill))
                      .slice(0, 10)
                      .map(skill => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => addSkill(skill)}
                          className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                        >
                          + {skill}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Current Role Display */}
            <div className="space-y-2">
              <Label>Current Role</Label>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Role:</span> {user?.role || 'Not specified'}
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Updating...' : 'Update Profile'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfilePage