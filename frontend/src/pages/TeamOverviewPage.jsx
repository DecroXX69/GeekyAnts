// File: src/pages/TeamOverviewPage.jsx
/**
 * TeamOverviewPage: Manager view to list and filter engineers by skills,
 * displaying capacity and details.
 */
import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorAlert from '@/components/ErrorAlert'
import CapacityBar from '@/components/CapacityBar'
import SkillTag from '@/components/SkillTag'
import axiosClient from '../api/axiosClient'

const TeamOverviewPage = () => {
  const [engineers, setEngineers] = useState([])
  const [allSkills, setAllSkills] = useState([])
  const [selectedSkills, setSelectedSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch engineers based on selected skills filter
  const fetchEngineers = async (skillsFilter = []) => {
    setLoading(true)
    setError(null)
    try {
      const skillsParam = skillsFilter.length > 0 ? `?skills=${skillsFilter.join(',')}` : ''
      const response = await axiosClient.get(`/engineers${skillsParam}`)
      setEngineers(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch engineers')
    } finally {
      setLoading(false)
    }
  }

  // Derive unique skills from all engineers for filter UI
  const deriveAllSkills = (engineersData) => {
    const skillsSet = new Set()
    engineersData.forEach(engineer => {
      if (engineer.skills && Array.isArray(engineer.skills)) {
        engineer.skills.forEach(skill => skillsSet.add(skill))
      }
    })
    return Array.from(skillsSet).sort()
  }

  // Initial fetch of all engineers to populate skills filter
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await axiosClient.get('/engineers')
        const engineersData = response.data
        setEngineers(engineersData)
        setAllSkills(deriveAllSkills(engineersData))
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch engineers')
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [])

  // Handle skill filter changes
  const handleSkillToggle = (skill) => {
    const updatedSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter(s => s !== skill)
      : [...selectedSkills, skill]
    
    setSelectedSkills(updatedSkills)
    fetchEngineers(updatedSkills)
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedSkills([])
    fetchEngineers([])
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} />

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Team Overview</h1>
        
        {/* Skills Filter Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter by Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              {allSkills.map(skill => (
                <div key={skill} className="flex items-center space-x-2">
                  <Checkbox
                    id={skill}
                    checked={selectedSkills.includes(skill)}
                    onCheckedChange={() => handleSkillToggle(skill)}
                  />
                  <Label htmlFor={skill}>{skill}</Label>
                </div>
              ))}
            </div>
            {selectedSkills.length > 0 && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Engineers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {engineers.map(engineer => (
          <Card key={engineer._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{engineer.name}</span>
                {engineer.seniority && (
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {engineer.seniority}
                  </span>
                )}
              </CardTitle>
              {engineer.department && (
                <p className="text-sm text-gray-600">{engineer.department}</p>
              )}
            </CardHeader>
            <CardContent>
              {/* Skills */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {engineer.skills && engineer.skills.length > 0 ? (
                    engineer.skills.map(skill => (
                      <SkillTag key={skill} skill={skill} />
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No skills listed</span>
                  )}
                </div>
              </div>

              {/* Capacity Information */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Capacity</h4>
                {engineer.capacity ? (
                  <>
                    <CapacityBar 
                      allocated={engineer.capacity.allocatedCapacity} 
                      maxCapacity={engineer.capacity.maxCapacity} 
                    />
                    <div className="text-sm text-gray-600 mt-1">
                      {engineer.capacity.utilizationPercent}% allocated, {' '}
                      {100 - engineer.capacity.utilizationPercent}% available
                    </div>
                  </>
                ) : (
                  <span className="text-gray-500 text-sm">Capacity data unavailable</span>
                )}
              </div>

              {/* Contact Info */}
              <div className="text-sm text-gray-600">
                <p>{engineer.email}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {engineers.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">
              {selectedSkills.length > 0 
                ? 'No engineers found with the selected skills.'
                : 'No engineers found.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default TeamOverviewPage