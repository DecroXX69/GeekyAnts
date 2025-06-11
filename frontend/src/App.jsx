// src/routes/AppRoutes.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/LoadingSpinner'

// Pages
import LoginPage from './pages/LoginPage'
import ManagerDashboard from './pages/ManagerDashboard'
import EngineerDashboard from './pages/EngineerDashboard'
import TeamOverviewPage from './pages/TeamOverviewPage'
import ProjectFormPage from './pages/ProjectFormPage'
import AssignmentFormPage from './pages/AssignmentFormPage'
import MyAssignmentsPage from './pages/MyAssignmentsPage'
import ProfilePage from './pages/ProfilePage'
import AnalyticsPage from './pages/AnalyticsPage'
import Layout from './components/Layout'

/**
 * AppRoutes: Main routing configuration
 * Handles role-based routing for Manager and Engineer users
 */
const AppRoutes = () => {
  const { user, loading } = useContext(AuthContext)

  // Show loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          {/* Manager Routes */}
          {user?.role === 'manager' && (
            <>
              <Route index element={<ManagerDashboard />} />
              <Route path="team" element={<TeamOverviewPage />} />
              <Route path="projects/new" element={<ProjectFormPage />} />
              <Route path="projects/:id/edit" element={<ProjectFormPage />} />
              <Route path="assignments/new" element={<AssignmentFormPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
            </>
          )}
          
          {/* Engineer Routes */}
          {user?.role === 'engineer' && (
            <>
              <Route index element={<EngineerDashboard />} />
              <Route path="assignments" element={<MyAssignmentsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </>
          )}
        </Route>
      </Route>

      {/* Fallback Routes */}
      <Route 
        path="/" 
        element={
          user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } 
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default AppRoutes