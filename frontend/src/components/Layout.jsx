// src/components/Layout.jsx
import React, { useContext } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * Layout: Main layout component with header navigation and content area
 * Provides role-based navigation and user info display
 */
const Layout = () => {
  const { user, logout } = useContext(AuthContext)
  const location = useLocation()

  // Navigation items based on user role
  const getNavItems = () => {
    if (user?.role === 'manager') {
      return [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/dashboard/team', label: 'Team Overview' },
        { path: '/dashboard/projects/new', label: 'New Project' },
        { path: '/dashboard/assignments/new', label: 'New Assignment' },
        { path: '/dashboard/analytics', label: 'Analytics' }
      ]
    } else if (user?.role === 'engineer') {
      return [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/dashboard/assignments', label: 'My Assignments' },
        { path: '/dashboard/profile', label: 'Profile' }
      ]
    }
    return []
  }

  const navItems = getNavItems()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Engineering Resource Management
              </h1>
            </div>

            {/* User Info and Logout */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{user?.name}</span>
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="text-gray-600 hover:text-gray-900"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  location.pathname === item.path
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout