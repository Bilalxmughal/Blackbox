import { useState, useEffect } from 'react'

// Custom hook to sync state with localStorage
export function useLocalStorage(key, initialValue) {
  // Get initial value from localStorage or use default
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return initialValue
    }
  })

  // Update localStorage when state changes
  const setValue = (value) => {
    try {
      // Allow value to be a function (like useState)
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  // Remove item from localStorage
  const removeValue = () => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.error('Error removing from localStorage:', error)
    }
  }

  return [storedValue, setValue, removeValue]
}

// Hook for loading data on mount
export function useLocalStorageGet(key, defaultValue = null) {
  const [data, setData] = useState(defaultValue)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(key)
      if (saved) {
        setData(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    }
  }, [key])

  return data
}

// Hook for saving data immediately
export function useLocalStorageSet(key, data) {
  useEffect(() => {
    try {
      if (data !== null && data !== undefined) {
        window.localStorage.setItem(key, JSON.stringify(data))
      }
    } catch (error) {
      console.error('Error auto-saving to localStorage:', error)
    }
  }, [key, data])
}