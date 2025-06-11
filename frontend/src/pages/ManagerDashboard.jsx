// src/pages/ManagerDashboard.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import useFetch from '../hooks/useFetch'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'

/**
 * ManagerDashboard: Main dashboard for managers
 * Displays utilization analytics and quick action buttons
 */
const ManagerDashboard = () => {
  const { data: utilization, loading, error } = useFetch('/analytics/utilization')

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

  // Calculate aggregate stats from utilization data
  const stats = utilization ? {
    totalEngineers: utilization.engineers?.length || 0,
    averageUtilization: utilization.engineers?.reduce((acc, eng) => acc + eng.utilization, 0) / (utilization.engineers?.length || 1) || 0,
    overAllocated: utilization.engineers?.filter(eng => eng.utilization > 100).length || 0,
    underUtilized: utilization.engineers?.filter(eng => eng.utilization < 80).length || 0
  } : { totalEngineers: 0, averageUtilization: 0, overAllocated: 0, underUtilized: 0 }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of team utilization and quick actions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Engineers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEngineers}</div>
            <p className="text-xs text-gray-600">Active team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.averageUtilization)}%</div>
            <p className="text-xs text-gray-600">Team average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Over Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overAllocated}</div>
            <p className="text-xs text-gray-600">Above 100% capacity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Utilized</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.underUtilized}</div>
            <p className="text-xs text-gray-600">Below 80% capacity</p>
          </CardContent>
        </Card>
      </div>

      {/* Utilization Chart */}
      {utilization?.engineers && (
        <Card>
          <CardHeader>
            <CardTitle>Team Utilization</CardTitle>
            <CardDescription>
              Current capacity utilization across all engineers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilization.engineers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Utilization']}
                  />
                  <Bar 
                    dataKey="utilization" 
                    fill="#3b82f6"
                    name="Utilization %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common management tasks and navigation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild className="h-20 flex-col">
              <Link to="/dashboard/team">
                <span className="font-semibold">Team Overview</span>
                <span className="text-xs opacity-75">View all engineers</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/dashboard/projects/new">
                <span className="font-semibold">New Project</span>
                <span className="text-xs opacity-75">Create project</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/dashboard/assignments/new">
                <span className="font-semibold">New Assignment</span>
                <span className="text-xs opacity-75">Assign engineer</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/dashboard/analytics">
                <span className="font-semibold">Analytics</span>
                <span className="text-xs opacity-75">Detailed reports</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ManagerDashboard