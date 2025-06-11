// File: src/pages/AnalyticsPage.jsx
import React, { useState, useEffect } from 'react'
import axiosClient from '../api/axiosClient'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorAlert from '@/components/ErrorAlert'
import SkillTag from '@/components/SkillTag'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

/**
 * AnalyticsPage: Dashboard analytics and insights
 * Route: /dashboard/analytics
 * Displays utilization charts, project status distribution, skill analytics, and skill gap analysis
 */
const AnalyticsPage = () => {
  // State for analytics data
  const [utilizationData, setUtilizationData] = useState(null)
  const [projectStatusData, setProjectStatusData] = useState(null)
  const [skillDistributionData, setSkillDistributionData] = useState(null)
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [skillGapData, setSkillGapData] = useState(null)
  
  // Loading and error states
  const [utilizationLoading, setUtilizationLoading] = useState(true)
  const [projectStatusLoading, setProjectStatusLoading] = useState(true)
  const [skillDistributionLoading, setSkillDistributionLoading] = useState(true)
  const [skillGapLoading, setSkillGapLoading] = useState(false)
  const [projectsLoading, setProjectsLoading] = useState(true)
  
  const [utilizationError, setUtilizationError] = useState(null)
  const [projectStatusError, setProjectStatusError] = useState(null)
  const [skillDistributionError, setSkillDistributionError] = useState(null)
  const [skillGapError, setSkillGapError] = useState(null)
  const [projectsError, setProjectsError] = useState(null)

  // Colors for charts
  const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  // Fetch utilization data
  useEffect(() => {
    const fetchUtilizationData = async () => {
      try {
        setUtilizationLoading(true)
        setUtilizationError(null)
        const response = await axiosClient.get('/analytics/utilization')
        
        // Transform data for chart - format engineer utilization for bar chart
        const chartData = response.data.engineers.map(engineer => ({
          name: engineer.name,
          utilization: Math.round(engineer.utilizationPercent || 0),
          maxCapacity: engineer.maxCapacity || 100,
          allocatedCapacity: engineer.allocatedCapacity || 0
        }))
        
        setUtilizationData(chartData)
      } catch (err) {
        setUtilizationError(err.response?.data?.message || 'Failed to load utilization data')
      } finally {
        setUtilizationLoading(false)
      }
    }

    fetchUtilizationData()
  }, [])

  // Fetch project status data
  useEffect(() => {
    const fetchProjectStatusData = async () => {
      try {
        setProjectStatusLoading(true)
        setProjectStatusError(null)
        const response = await axiosClient.get('/analytics/project-status')
        setProjectStatusData(response.data)
      } catch (err) {
        setProjectStatusError(err.response?.data?.message || 'Failed to load project status data')
      } finally {
        setProjectStatusLoading(false)
      }
    }

    fetchProjectStatusData()
  }, [])

  // Fetch skill distribution data
  useEffect(() => {
    const fetchSkillDistributionData = async () => {
      try {
        setSkillDistributionLoading(true)
        setSkillDistributionError(null)
        const response = await axiosClient.get('/analytics/skill-distribution')
        setSkillDistributionData(response.data)
      } catch (err) {
        setSkillDistributionError(err.response?.data?.message || 'Failed to load skill distribution data')
      } finally {
        setSkillDistributionLoading(false)
      }
    }

    fetchSkillDistributionData()
  }, [])

  // Fetch projects for skill gap analysis
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setProjectsLoading(true)
        setProjectsError(null)
        const response = await axiosClient.get('/projects')
        setProjects(response.data)
      } catch (err) {
        setProjectsError(err.response?.data?.message || 'Failed to load projects')
      } finally {
        setProjectsLoading(false)
      }
    }

    fetchProjects()
  }, [])

  // Fetch skill gap data when project is selected
  useEffect(() => {
    const fetchSkillGapData = async () => {
      if (!selectedProject) {
        setSkillGapData(null)
        return
      }

      try {
        setSkillGapLoading(true)
        setSkillGapError(null)
        const response = await axiosClient.get(`/analytics/skill-gap?projectId=${selectedProject}`)
        setSkillGapData(response.data)
      } catch (err) {
        setSkillGapError(err.response?.data?.message || 'Failed to load skill gap analysis')
      } finally {
        setSkillGapLoading(false)
      }
    }

    fetchSkillGapData()
  }, [selectedProject])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Insights into team utilization, project status, and skill distribution
        </p>
      </div>

      <div className="grid gap-6">
        {/* Team Utilization Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Team Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            {utilizationLoading ? (
              <LoadingSpinner />
            ) : utilizationError ? (
              <ErrorAlert message={utilizationError} />
            ) : utilizationData && utilizationData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={utilizationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value, name) => [`${value}%`, name]}
                      labelFormatter={(label) => `Engineer: ${label}`}
                    />
                    <Bar dataKey="utilization" fill="#0088FE" name="Utilization %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No utilization data available</p>
            )}
          </CardContent>
        </Card>

        {/* Project Status Distribution */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {projectStatusLoading ? (
                <LoadingSpinner />
              ) : projectStatusError ? (
                <ErrorAlert message={projectStatusError} />
              ) : projectStatusData && projectStatusData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, count }) => `${status}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {projectStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No project status data available</p>
              )}
            </CardContent>
          </Card>

          {/* Skill Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Skill Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {skillDistributionLoading ? (
                <LoadingSpinner />
              ) : skillDistributionError ? (
                <ErrorAlert message={skillDistributionError} />
              ) : skillDistributionData && skillDistributionData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={skillDistributionData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="skill" 
                        type="category" 
                        width={80}
                        fontSize={12}
                      />
                      <Tooltip />
                      <Bar dataKey="count" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No skill distribution data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Skill Gap Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Skill Gap Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Project Selection */}
              <div className="space-y-2">
                <Label htmlFor="project-select">Select Project for Analysis</Label>
                {projectsLoading ? (
                  <LoadingSpinner />
                ) : projectsError ? (
                  <ErrorAlert message={projectsError} />
                ) : (
                  <Select onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a project to analyze" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project._id} value={project._id}>
                          {project.name} ({project.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Skill Gap Results */}
              {skillGapLoading ? (
                <LoadingSpinner />
              ) : skillGapError ? (
                <ErrorAlert message={skillGapError} />
              ) : skillGapData ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Analysis for: {skillGapData.projectName}
                    </h3>
                  </div>

                  {/* Required Skills */}
                 <div>
  <h4 className="font-medium mb-2">Required Skills</h4>
  <div className="flex flex-wrap gap-2">
    {skillGapData.requiredSkills && skillGapData.requiredSkills.length > 0 ? 
      skillGapData.requiredSkills.map((skill, idx) => (
        <SkillTag 
          key={`required-skill-${skillGapData.projectName}-${skill}-${idx}`} 
          skill={skill} 
        />
      )) : 
      <span className="text-gray-500">No required skills specified</span>
    }
  </div>
</div>

                  {/* Assigned Engineers */}
                  <div>
                    <h4 className="font-medium mb-2">
                      Assigned Engineers ({skillGapData.assignedEngineers?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {skillGapData.assignedEngineers && skillGapData.assignedEngineers.length > 0 ? 
                        skillGapData.assignedEngineers.map(engineer => (
                          <div key={engineer._id} className="bg-gray-50 p-3 rounded">
                            <p className="font-medium">{engineer.name}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {engineer.skills && engineer.skills.length > 0 ? 
  engineer.skills.map((skill, idx) => (
    <SkillTag key={`${skill}-${idx}`} skill={skill} size="sm" />
  )) : 
  <span className="text-sm text-gray-500">No skills listed</span>
}
                            </div>
                          </div>
                        )) : 
                        <p className="text-gray-500">No engineers assigned</p>
                      }
                    </div>
                  </div>

                  {/* Available Skills */}
                  <div>
                    <h4 className="font-medium mb-2">Available Skills (from assigned team)</h4>
                    <div className="flex flex-wrap gap-2">
                     {skillGapData.availableSkills && skillGapData.availableSkills.length > 0 ? 
  skillGapData.availableSkills.map((skill, idx) => (
    <SkillTag key={`${skill}-${idx}`} skill={skill} variant="success" />
  )) : 
  <span className="text-gray-500">No skills available from current team</span>
}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div>
                    <h4 className="font-medium mb-2">Missing Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {skillGapData.missingSkills && skillGapData.missingSkills.length > 0 ? 
  skillGapData.missingSkills.map((skill, idx) => (
    <SkillTag key={`${skill}-${idx}`} skill={skill} variant="missing" />
  )) : 
  <span className="text-green-600 font-medium">All required skills are covered!</span>
}
                    </div>
                  </div>

                  {/* Skill Coverage */}
                  <div>
                    <h4 className="font-medium mb-2">Skill Coverage</h4>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="flex justify-between items-center">
                        <span>Coverage Percentage:</span>
                        <span className={`font-bold ${
                          (skillGapData.skillCoverage || 0) >= 80 ? 'text-green-600' :
                          (skillGapData.skillCoverage || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {Math.round(skillGapData.skillCoverage || 0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (skillGapData.skillCoverage || 0) >= 80 ? 'bg-green-600' :
                            (skillGapData.skillCoverage || 0) >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${skillGapData.skillCoverage || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : selectedProject ? null : (
                <p className="text-center text-gray-500 py-8">
                  Select a project to see skill gap analysis
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AnalyticsPage