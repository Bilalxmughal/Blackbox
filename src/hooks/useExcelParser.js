import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'

export function useExcelParser() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState('')

  // Parse Excel file
  const parseExcel = useCallback((file) => {
    return new Promise((resolve, reject) => {
      setLoading(true)
      setError(null)
      setFileName(file.name)

      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          
          // Get first sheet
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          
          setData(jsonData)
          setLoading(false)
          resolve(jsonData)
        } catch (err) {
          setError('Error parsing Excel file: ' + err.message)
          setLoading(false)
          reject(err)
        }
      }

      reader.onerror = () => {
        setError('Error reading file')
        setLoading(false)
        reject(new Error('File read error'))
      }

      reader.readAsArrayBuffer(file)
    })
  }, [])

  // Parse CSV file
  const parseCSV = useCallback((file) => {
    return new Promise((resolve, reject) => {
      setLoading(true)
      setError(null)
      setFileName(file.name)

      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const text = e.target.result
          const lines = text.split('\n')
          const headers = lines[0].split(',').map(h => h.trim())
          
          const jsonData = []
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              const values = lines[i].split(',')
              const obj = {}
              headers.forEach((header, index) => {
                obj[header] = values[index]?.trim() || ''
              })
              jsonData.push(obj)
            }
          }

          setData(jsonData)
          setLoading(false)
          resolve(jsonData)
        } catch (err) {
          setError('Error parsing CSV file: ' + err.message)
          setLoading(false)
          reject(err)
        }
      }

      reader.onerror = () => {
        setError('Error reading file')
        setLoading(false)
        reject(new Error('File read error'))
      }

      reader.readAsText(file)
    })
  }, [])

  // Auto-detect and parse
  const parseFile = useCallback((file) => {
    const extension = file.name.split('.').pop().toLowerCase()
    
    if (extension === 'csv') {
      return parseCSV(file)
    } else if (['xlsx', 'xls'].includes(extension)) {
      return parseExcel(file)
    } else {
      const err = new Error('Unsupported file format. Use .xlsx, .xls, or .csv')
      setError(err.message)
      return Promise.reject(err)
    }
  }, [parseExcel, parseCSV])

  // Clear data
  const clearData = useCallback(() => {
    setData([])
    setError(null)
    setFileName('')
  }, [])

  return {
    data,
    loading,
    error,
    fileName,
    parseExcel,
    parseCSV,
    parseFile,
    clearData
  }
}

// Hook for drag and drop
export function useDragAndDrop(onDrop) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      onDrop(files[0])
    }
  }

  return {
    isDragging,
    handlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop
    }
  }
}