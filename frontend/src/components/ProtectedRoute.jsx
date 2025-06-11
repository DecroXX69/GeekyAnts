// src/components/ProtectedRoute.jsx
import React, { useContext } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

/**
 * ProtectedRoute: Wrapper component that protects routes requiring authentication
 * Redirects to login if user is not authenticated, shows loading while checking auth
 */
const ProtectedRoute = () => {
  const { user, loading } = useContext(AuthContext)

  // Show loading spinner while authentication is being verified
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Render child routes if authenticated
  return <Outlet />
}

export default ProtectedRoute