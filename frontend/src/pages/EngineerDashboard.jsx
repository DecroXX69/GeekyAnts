// src/pages/EngineerDashboard.jsx
import React, { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import useFetch from '../hooks/useFetch'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import { formatDate } from '../utils/dateUtils'
import CapacityBar from '../components/CapacityBar'

/**
 * EngineerDashboard: Personal dashboard for engineers
 * Shows availability, current assignments, and utilization
 */
const EngineerDashboard = () => {
  const { user } = useContext(AuthContext)
  
  const { data: availability, loading: availabilityLoading, error: availabilityError } = 
  useFetch(`/engineers/${user?._id}/availability`) // Changed from user?.id to user?._id

const { data: assignments, loading: assignmentsLoading, error: assignmentsError } = 
  useFetch(`/assignments?engineerId=${user?._id}`) // Changed from user?.id to user?._id

const { data: capacity, loading: capacityLoading, error: capacityError } = 
  useFetch(`/engineers/${user?._id}/capacity`) // Changed from user?.id to user?._id

  const loading = availabilityLoading || assignmentsLoading || capacityLoading
  const error = availabilityError || assignmentsError || capacityError

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

  // Process assignments for chart data
  const chartData = assignments?.map(assignment => ({
    project: assignment.project?.name || 'Unknown Project',
    allocation: assignment.allocationPercentage,
    role: assignment.role
  })) || []

  const totalAllocation = assignments?.reduce((sum, assignment) => 
    sum + assignment.allocationPercentage, 0) || 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Your assignments, availability, and capacity overview
        </p>
      </div>

      {/* Capacity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAllocation}%</div>
            <div className="mt-2">
              <CapacityBar 
                allocated={totalAllocation} 
                max={capacity?.maxCapacity || 100} 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(0, (capacity?.maxCapacity || 100) - totalAllocation)}%
            </div>
            <p className="text-xs text-gray-600">Remaining capacity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments?.length || 0}</div>
            <p className="text-xs text-gray-600">Current assignments</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
          <CardDescription>
            Your active project assignments and roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignments && assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div 
                  key={assignment.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">
                      {assignment.project?.name || 'Unknown Project'}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {formatDate(assignment.startDate)} - {formatDate(assignment.endDate)}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{assignment.role}</Badge>
                      <Badge variant={assignment.allocationPercentage > 50 ? 'default' : 'secondary'}>
                        {assignment.allocationPercentage}% allocated
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        assignment.project?.status === 'active' ? 'default' :
                        assignment.project?.status === 'planning' ? 'secondary' : 'outline'
                      }
                    >
                      {assignment.project?.status || 'Unknown'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No current assignments. Check with your manager for new projects.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Assignment Allocation Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Allocation by Project</CardTitle>
            <CardDescription>
              Your capacity distribution across projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="project" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [`${value}%`, 'Allocation']}
                    labelFormatter={(label) => `Project: ${label}`}
                  />
                  <Bar 
                    dataKey="allocation" 
                    fill="#10b981"
                    name="Allocation %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Availability Windows */}
      {availability && availability.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Availability Windows</CardTitle>
            <CardDescription>
              Periods when you're available for new assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availability.map((window, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {formatDate(window.startDate)} - {formatDate(window.endDate)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {window.capacity}% capacity available
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-white">
                    Available
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default EngineerDashboard