// Optional - For testing only
export const mockOpsData = [
  {
    id: 'OPS-001',
    captainId: 'CAP-1001',
    vendorName: 'Ali Transport',
    captainName: 'Muhammad Ali',
    busNumber: 'BUS-4521',
    routeName: 'Gulshan to Saddar',
    captainPersonalMobile: '0301-9876543',
    contractorNameInDb: 'Ali Transport Pvt Ltd'
  },
  {
    id: 'OPS-002',
    captainId: 'CAP-1002',
    vendorName: 'Khan Motors',
    captainName: 'Ahmed Khan',
    busNumber: 'BUS-4522',
    routeName: 'Karachi to Hyderabad',
    captainPersonalMobile: '0302-8765432',
    contractorNameInDb: 'Khan Motors Ltd'
  }
]

export const mockComplaints = [
  {
    id: 'comp-1',
    ticketNo: 'VEH-160326-001',
    date: '2024-03-16',
    routeName: 'Gulshan to Saddar',
    accountName: 'Ali Transport Pvt Ltd',
    vendorName: 'Ali Transport',
    captainName: 'Muhammad Ali',
    captainContact: '0301-9876543',
    issueCategory: 'cat-1',
    issueType: 'sub-1',
    issueDetails: 'Engine overheating',
    assignedDept: 'Vehicle',
    assignedTo: 'Mechanic Ali',
    submittedBy: 'Admin',
    ticketStatus: 'Open',
    complaintStatus: 'Pending',
    pendingDays: 2,
    resolvedPercent: 0
  }
]