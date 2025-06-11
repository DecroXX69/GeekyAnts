// src/pages/TeamOverviewPage.jsx
import React, { useState, useEffect } from 'react'
import axiosClient from '../api/axiosClient'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import CapacityBar from '../components/CapacityBar'
import SkillTag from '../components/SkillTag'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

/**
 * TeamOverviewPage: Manager-only page to view and filter all engineers
 * Fetches engineers from `/engineers` endpoint, allows filtering by skills,
 * and displays each engineer's profile, skills, and capacity bar.
 */
const TeamOverviewPage = () => {
  // All engineers data
  const [engineers, setEngineers] = useState([])
  // Unique skills extracted from engineers
  const [allSkills, setAllSkills] = useState([])
  // Currently selected skills for filtering
  const [selectedSkills, setSelectedSkills] = useState([])
  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  /**
   * Fetch engineers from backend, optionally filtered by skills
   */
  const fetchEngineers = async (skills = []) => {
    setLoading(true)
    setError('')
    try {
      // Build query string if skills filter applied
      const query = skills.length
        ? `?skills=${encodeURIComponent(skills.join(','))}`
        : ''
      const response = await axiosClient.get(`/engineers${query}`)
      const data = response.data
      setEngineers(data)
      // Extract unique skills for filter dropdown
      const skillsSet = new Set()
      data.forEach((eng) => {
        (eng.skills || []).forEach((skill) => {
          skillsSet.add(skill)
        })
      })
      setAllSkills(Array.from(skillsSet).sort())
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch on mount
  useEffect(() => {
    fetchEngineers()
  }, [])

  /**
   * Handle changes in the multi-select skills filter
   */
  const handleSkillChange = (e) => {
    // Read selected options from the <select multiple>
    const options = Array.from(e.target.selectedOptions)
    const skills = options.map((opt) => opt.value)
    setSelectedSkills(skills)
  }

  /**
   * Apply filter whenever selectedSkills changes
   */
  useEffect(() => {
    fetchEngineers(selectedSkills)
  }, [selectedSkills])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return <ErrorAlert message={error} />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team Overview</h1>
        <p className="mt-1 text-gray-600">
          Browse and filter all engineers in your organization.
        </p>
      </div>

      {/* Skills Filter */}
      <div className="mb-4">
        <Label htmlFor="skills-filter" className="block mb-1">
          Filter by Skills
        </Label>
        <select
          id="skills-filter"
          multiple
          value={selectedSkills}
          onChange={handleSkillChange}
          className="w-full border-gray-300 rounded p-2 h-32 focus:ring-blue-500 focus:border-blue-500"
        >
          {allSkills.map((skill) => (
            <option key={skill} value={skill}>
              {skill}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Hold Ctrl (Cmd on Mac) to select multiple skills.
        </p>
      </div>

      {/* Engineers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {engineers.length > 0 ? (
          engineers.map((engineer) => (
            <Card key={engineer._id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {engineer.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Skills */}
                <div className="flex flex-wrap gap-2">
                  {(engineer.skills || []).map((skill) => (
                    <SkillTag key={skill} skill={skill} variant="default" />
                  ))}
                </div>

                {/* Capacity Bar */}
                {engineer.capacity && (
                  <div className="space-y-1">
                    <div className="text-sm text-gray-700">
                      Allocated: {engineer.capacity.allocatedCapacity}% / Max: {engineer.capacity.maxCapacity}%
                    </div>
                    <CapacityBar
                      allocated={engineer.capacity.allocatedCapacity}
                      maxCapacity={engineer.capacity.maxCapacity}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center py-8">
            No engineers found matching the selected skills.
          </p>
        )}
      </div>
    </div>
  )
}

export default TeamOverviewPage
