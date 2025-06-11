// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react'
import axiosClient from '../api/axiosClient'
import { useNavigate } from 'react-router-dom'

export const AuthContext = createContext()

/**
 * AuthProvider: Manages authentication state across the application
 * Provides user data, token, login, and logout functions
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Load token from localStorage on mount and verify with backend
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      axiosClient.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
      
      // Verify token with backend by fetching user profile
      axiosClient.get('/auth/profile')
        .then(res => {
          setUser(res.data)
        })
        .catch(() => {
          // Invalid token - clear and redirect to login
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
          delete axiosClient.defaults.headers.common['Authorization']
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  /**
   * Login function - authenticates user and stores token
   */
  const login = async (email, password) => {
    try {
      const response = await axiosClient.post('/auth/login', { email, password })
      const { token: newToken, user: userData } = response.data
      
      // Store token and set user state
      localStorage.setItem('token', newToken)
      setToken(newToken)
      axiosClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      setUser(userData)
      
      // Navigate to dashboard
      navigate('/dashboard')
    } catch (error) {
      throw error
    }
  }

  /**
   * Logout function - clears user state and redirects to login
   */
  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete axiosClient.defaults.headers.common['Authorization']
    navigate('/login')
  }

  const value = {
    user,
    token,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}