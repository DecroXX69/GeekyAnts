// src/components/ErrorAlert.jsx
import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

/**
 * ErrorAlert: Displays error messages in a consistent format
 * @param {string} message - Error message to display
 * @param {string} className - Additional CSS classes
 */
const ErrorAlert = ({ message, className = '' }) => {
  if (!message) return null

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {message}
      </AlertDescription>
    </Alert>
  )
}

export default ErrorAlert