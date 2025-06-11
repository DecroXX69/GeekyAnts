// src/hooks/useFetch.js
import { useState, useEffect } from 'react'
import axiosClient from '../api/axiosClient'

/**
 * useFetch: Custom hook for GET requests with loading and error states
 * @param {string} url - API endpoint URL (relative to baseURL)
 * @param {array} deps - Dependencies array for useEffect
 * @returns {object} { data, loading, error, refetch }
 */
const useFetch = (url, deps = []) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axiosClient.get(url)
      setData(response.data)
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (url) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps])

  return { data, loading, error, refetch: fetchData }
}

export default useFetch