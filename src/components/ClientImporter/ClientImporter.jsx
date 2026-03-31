import { useState, useRef } from 'react'
import { 
  Upload, FileSpreadsheet, X, CheckCircle, AlertCircle,
  Download, Eye, Trash2, Save
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { useAuth } from '../../context/AuthContext'
import { createClient } from '../../lib/firebase'
import { 
  CLIENT_LOCATIONS, 
  BUSINESS_TYPES, 
  INDUSTRIES,
  generateClientId
} from '../../data/clientConfig'
import styles from './ClientImporter.module.css'

function ClientImporter({ onImportComplete, existingClients }) {
  const { currentUser } = useAuth()
  const fileInputRef = useRef(null)
  
  const [file, setFile] = useState(null)
  const [previewData, setPreviewData] = useState([])
  const [importedData, setImportedData] = useState([])
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('upload') // upload, preview, confirm

  // Expected columns mapping
  const columnMapping = {
    'Client Legal Name': 'legalName',
    'Industry': 'industry',
    'Location': 'location',
    'Billing Address': 'billingAddress',
    'POC Name': 'pocName',
    'POC Email': 'pocEmail',
    'Account Manager': 'accountManager',
    'Account Manager Email': 'accountManagerEmail',
    'Business Type': 'businessType'
  }

  // Handle file selection
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return
    
    setFile(selectedFile)
    processFile(selectedFile)
  }

  // Process Excel/CSV file
  const processFile = (selectedFile) => {
    setLoading(true)
    setErrors([])
    
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target.result
        let jsonData = []
        
        if (selectedFile.name.endsWith('.csv')) {
          // Parse CSV
          const lines = data.split('\n')
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
          
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
            const row = {}
            headers.forEach((header, index) => {
              row[header] = values[index] || ''
            })
            jsonData.push(row)
          }
        } else {
          // Parse Excel
          const workbook = XLSX.read(data, { type: 'binary' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          jsonData = XLSX.utils.sheet_to_json(firstSheet)
        }
        
        // Validate and transform data
        const validated = validateData(jsonData)
        setPreviewData(validated.valid)
        setErrors(validated.errors)
        setStep('preview')
        
      } catch (error) {
        console.error('Error processing file:', error)
        setErrors([{ row: 0, message: 'Failed to process file. Please check format.' }])
      } finally {
        setLoading(false)
      }
    }
    
    if (selectedFile.name.endsWith('.csv')) {
      reader.readAsText(selectedFile)
    } else {
      reader.readAsBinaryString(selectedFile)
    }
  }

  // Validate imported data
  const validateData = (data) => {
    const valid = []
    const errors = []
    
    data.forEach((row, index) => {
      const rowErrors = []
      const transformed = {}
      
      // Map columns
      Object.entries(columnMapping).forEach(([excelCol, field]) => {
        transformed[field] = row[excelCol] || row[field] || ''
      })
      
      // Validate required fields
      if (!transformed.legalName?.trim()) {
        rowErrors.push('Legal Name is required')
      }
      if (!transformed.industry?.trim()) {
        rowErrors.push('Industry is required')
      }
      if (!transformed.location?.trim()) {
        rowErrors.push('Location is required')
      }
      if (!transformed.pocEmail?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(transformed.pocEmail)) {
        rowErrors.push('Valid POC Email is required')
      }
      if (!transformed.businessType?.trim()) {
        rowErrors.push('Business Type is required')
      }
      
      // Validate against allowed values
      const validIndustries = INDUSTRIES.map(i => i.value)
      const validLocations = CLIENT_LOCATIONS.map(l => l.value)
      const validBusinessTypes = BUSINESS_TYPES.map(b => b.value)
      
      if (transformed.industry && !validIndustries.includes(transformed.industry.toLowerCase())) {
        // Try to match by label
        const matched = INDUSTRIES.find(i => 
          i.label.toLowerCase() === transformed.industry.toLowerCase()
        )
        if (matched) {
          transformed.industry = matched.value
        } else {
          rowErrors.push(`Invalid industry: ${transformed.industry}`)
        }
      }
      
      if (transformed.location && !validLocations.includes(transformed.location.toLowerCase())) {
        const matched = CLIENT_LOCATIONS.find(l => 
          l.label.toLowerCase() === transformed.location.toLowerCase()
        )
        if (matched) {
          transformed.location = matched.value
        } else {
          rowErrors.push(`Invalid location: ${transformed.location}`)
        }
      }
      
      if (transformed.businessType && !validBusinessTypes.includes(transformed.businessType.toLowerCase())) {
        const matched = BUSINESS_TYPES.find(b => 
          b.label.toLowerCase() === transformed.businessType.toLowerCase()
        )
        if (matched) {
          transformed.businessType = matched.value
        } else {
          rowErrors.push(`Invalid business type: ${transformed.businessType}`)
        }
      }
      
      if (rowErrors.length > 0) {
        errors.push({ row: index + 2, message: rowErrors.join(', '), data: transformed })
      } else {
        valid.push(transformed)
      }
    })
    
    return { valid, errors }
  }

  // Import validated clients
  const handleImport = async () => {
    setLoading(true)
    const imported = []
    const failed = []
    
    for (const clientData of previewData) {
      try {
        // Generate client ID
        const allClients = [...existingClients, ...imported]
        const clientId = generateClientId(allClients)
        
        const newClient = {
          ...clientData,
          clientId,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          id: `cli-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
        
        // Save to Firebase
        const result = await createClient(newClient)
        if (result.success) {
          newClient.id = result.id
          newClient.firebaseId = result.id
        }
        
        imported.push(newClient)
        
      } catch (error) {
        console.error('Error importing client:', error)
        failed.push({ data: clientData, error: error.message })
      }
    }
    
    setImportedData(imported)
    setStep('confirm')
    setLoading(false)
    
    // Update localStorage
    const saved = localStorage.getItem('clients')
    const existing = saved ? JSON.parse(saved) : []
    const updated = [...imported, ...existing]
    localStorage.setItem('clients', JSON.stringify(updated))
    
    // Notify parent
    onImportComplete(imported)
  }

  // Remove item from preview
  const removePreviewItem = (index) => {
    const updated = [...previewData]
    updated.splice(index, 1)
    setPreviewData(updated)
  }

  // Download template
  const downloadTemplate = () => {
    const template = [
      {
        'Client Legal Name': 'ABC Transport Ltd',
        'Industry': 'Transportation',
        'Location': 'Lahore',
        'Billing Address': '123 Main Street, Lahore, Pakistan',
        'POC Name': 'John Doe',
        'POC Email': 'john@abctransport.com',
        'Account Manager': 'Jane Smith',
        'Account Manager Email': 'jane@buscaro.com',
        'Business Type': 'B2B'
      }
    ]
    
    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Clients Template')
    XLSX.writeFile(wb, 'client_import_template.xlsx')
  }

  // Reset importer
  const handleReset = () => {
    setFile(null)
    setPreviewData([])
    setImportedData([])
    setErrors([])
    setStep('upload')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={styles.importerContainer}>
      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className={styles.uploadSection}>
          <div className={styles.templateDownload}>
            <p>Download template file to get started:</p>
            <button className={styles.templateBtn} onClick={downloadTemplate}>
              <Download size={16} /> Download Excel Template
            </button>
          </div>
          
          <div 
            className={styles.dropZone}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".xlsx,.xls,.csv"
              hidden
            />
            <Upload size={48} color="#00d4ff" />
            <h3>Upload Client File</h3>
            <p>Drag & drop or click to select</p>
            <span className={styles.fileTypes}>Supported: .xlsx, .xls, .csv</span>
          </div>
          
          {loading && <div className={styles.processing}>Processing file...</div>}
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && (
        <div className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <h3>
              <FileSpreadsheet size={20} />
              Preview Import ({previewData.length} valid, {errors.length} errors)
            </h3>
            <div className={styles.previewActions}>
              <button className={styles.backBtn} onClick={handleReset}>
                <X size={16} /> Cancel
              </button>
              {previewData.length > 0 && (
                <button 
                  className={styles.importBtn} 
                  onClick={handleImport}
                  disabled={loading}
                >
                  <Save size={16} />
                  {loading ? 'Importing...' : `Import ${previewData.length} Clients`}
                </button>
              )}
            </div>
          </div>

          {/* Errors Section */}
          {errors.length > 0 && (
            <div className={styles.errorsSection}>
              <h4>
                <AlertCircle size={16} color="#ff6b6b" />
                Errors Found ({errors.length})
              </h4>
              <div className={styles.errorsList}>
                {errors.slice(0, 5).map((err, idx) => (
                  <div key={idx} className={styles.errorItem}>
                    <span>Row {err.row}:</span> {err.message}
                  </div>
                ))}
                {errors.length > 5 && (
                  <div className={styles.moreErrors}>...and {errors.length - 5} more</div>
                )}
              </div>
            </div>
          )}

          {/* Valid Data Preview */}
          {previewData.length > 0 ? (
            <div className={styles.previewTable}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Legal Name</th>
                    <th>Industry</th>
                    <th>Location</th>
                    <th>POC Email</th>
                    <th>Business Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{item.legalName}</td>
                      <td>{item.industry}</td>
                      <td>{item.location}</td>
                      <td>{item.pocEmail}</td>
                      <td>{item.businessType}</td>
                      <td>
                        <button 
                          className={styles.removeBtn}
                          onClick={() => removePreviewItem(idx)}
                          title="Remove from import"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.noValidData}>
              <AlertCircle size={32} color="#ff6b6b" />
              <p>No valid data found to import</p>
              <button className={styles.backBtn} onClick={handleReset}>
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirm' && (
        <div className={styles.confirmSection}>
          <div className={styles.successMessage}>
            <CheckCircle size={48} color="#6bcf7f" />
            <h3>Import Complete!</h3>
            <p>Successfully imported {importedData.length} clients</p>
          </div>
          
          <div className={styles.importedList}>
            <h4>Imported Clients:</h4>
            {importedData.map((client, idx) => (
              <div key={idx} className={styles.importedItem}>
                <span className={styles.importedId}>{client.clientId}</span>
                <span className={styles.importedName}>{client.legalName}</span>
              </div>
            ))}
          </div>
          
          <button className={styles.doneBtn} onClick={handleReset}>
            Import More
          </button>
        </div>
      )}
    </div>
  )
}

export default ClientImporter