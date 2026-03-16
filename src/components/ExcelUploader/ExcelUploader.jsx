import { useState } from 'react'
import { Upload, FileSpreadsheet, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import styles from './ExcelUploader.module.css'

function ExcelUploader({ onDataUploaded }) {
  const [dragActive, setDragActive] = useState(false)
  const [fileName, setFileName] = useState('')

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file) => {
    setFileName(file.name)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet)
      
      // Map Excel columns to our format
      const mappedData = jsonData.map((row, index) => ({
        id: `OPS-${Date.now()}-${index}`,
        captainId: row['Captain ID'] || '',
        vendorName: row['Vendor Name'] || '',
        captainName: row['Captain Name'] || '',
        busNumber: row['Bus Number'] || '',
        vehicleId: row['Vehicle ID'] || '',
        paymentTerms: row['Payment terms'] || '',
        engine: row['Engine'] || '',
        vehicleCategory: row['Vehicle Category'] || '',
        busType: row['Bus_Type'] || '',
        seats: row['Seats'] || 0,
        trackerStatus: row['Tracker Status'] || '',
        trackerActiveStatus: row['Tracker Active Status'] || '',
        routeType: row['Route Type'] || '',
        company: row['Company'] || '',
        firstRideRouteId: row['1st Ride_Route ID'] || '',
        routeName: row['Route Name'] || '',
        totalInrideKm: row['Total_inride_km'] || 0,
        rent: row['Rent'] || 0,
        garageRent: row['Garage Rent'] || 0,
        rentDays: row['Rent Days'] || 0,
        mileage: row['Mileage'] || 0,
        vendorBonusMonthly: row['Vendor Bonus (Monthly)'] || 0,
        captainBonusMonthly: row['Captain Bonus (Monthly)'] || 0,
        maintenanceRate: row['Maintenance Rate'] || 0,
        ridesCount: row['Rides Count'] || 0,
        fuelRate: row['Fuel Rate'] || 0,
        basicPlanRate: row['Basic plan (Rate/Ride)'] || 0,
        variablePlanRsKm: row['Variable Plan(Rs/Km)'] || 0,
        status: row['Status'] || '',
        gmv: row['GMV'] || 0,
        margin: row['Margin'] || 0,
        comments: row['Comments'] || '',
        startDate: row['Start Date'] || '',
        endDate: row['End Date'] || '',
        reasonOfEnd: row['Reason of End'] || '',
        captainSignupDate: row['Captain Signup Date'] || '',
        capFirstRide: row['Cap_first_ride'] || '',
        capLastRide: row['Cap_last_ride'] || '',
        contractorId: row['Contractor ID'] || '',
        vendorCnic: row['Vendor CNIC'] || '',
        vendorNumber: row['Vendor Number'] || '',
        contractorNameInDb: row['Contractor Name In DB'] || '',
        vendorFilerStatus: row['Vendor Filer Status'] || '',
        vendorRepeatedName: row['Vendor Repeated Name'] || '',
        vendorCreationDate: row['vendor_creation Date'] || '',
        totalBasic: row['Total Basic'] || 0,
        captain2: row['Captain 2'] || '',
        captain2Num: row['Captain 2 Num'] || '',
        busNumberInDb: row['Bus Number in DB'] || '',
        trackerComments: row['Tracker Comments'] || '',
        captainEpMethodStatus: row['Captain EP Method Status'] || '',
        dbStatusOfFinancial: row['DB Status of Financial'] || '',
        repeatedId: row['Repeated ID'] || '',
        dbStatusOfVehicle: row['DB Status of Vehicle'] || '',
        epNumber: row['EP Number'] || '',
        captainPersonalMobile: row['Captain Personal Mobile'] || '',
        captainCnic: row['Captain CNIC'] || '',
        garageInDb: row['Garage in DB'] || '',
        ntn: row['NTN'] || '',
        vendorType: row['Vendor Type'] || '',
        iban: row['IBAN'] || ''
      }))
      
      onDataUploaded(mappedData)
    }
    reader.readAsArrayBuffer(file)
  }

  const clearFile = () => {
    setFileName('')
    onDataUploaded([])
  }

  return (
    <div className={styles.uploaderContainer}>
      {!fileName ? (
        <div 
          className={`${styles.dropZone} ${dragActive ? styles.active : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            id="excel-upload"
            accept=".xlsx,.xls,.csv"
            onChange={handleChange}
            className={styles.fileInput}
          />
          <label htmlFor="excel-upload" className={styles.uploadLabel}>
            <Upload size={48} className={styles.uploadIcon} />
            <p className={styles.uploadText}>
              <strong>Click to upload</strong> or drag and drop
            </p>
            <p className={styles.uploadSubtext}>
              Excel files (.xlsx, .xls, .csv)
            </p>
          </label>
        </div>
      ) : (
        <div className={styles.filePreview}>
          <FileSpreadsheet size={32} className={styles.fileIcon} />
          <div className={styles.fileInfo}>
            <p className={styles.fileName}>{fileName}</p>
            <p className={styles.fileStatus}>✓ Uploaded successfully</p>
          </div>
          <button onClick={clearFile} className={styles.clearBtn}>
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  )
}

export default ExcelUploader