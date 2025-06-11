// src/utils/dateUtils.js
import { format, parseISO } from 'date-fns'

/**
 * formatDate: Formats an ISO date string to readable format
 * @param {string} isoString - ISO date string
 * @param {string} formatStr - Format pattern (default: 'MMM d, yyyy')
 * @returns {string} Formatted date string
 */
export const formatDate = (isoString, formatStr = 'MMM d, yyyy') => {
  try {
    return format(parseISO(isoString), formatStr)
  } catch {
    return isoString
  }
}

/**
 * formatDateForInput: Formats date for HTML date input (YYYY-MM-DD)
 * @param {string} isoString - ISO date string
 * @returns {string} Date in YYYY-MM-DD format
 */
export const formatDateForInput = (isoString) => {
  try {
    return format(parseISO(isoString), 'yyyy-MM-dd')
  } catch {
    return ''
  }
}