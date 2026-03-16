export const initialCategories = [
  {
    id: 'cat-1',
    name: 'Vehicle',
    code: 'VEH',
    subCategories: [
      {
        id: 'sub-1',
        name: 'Engine Issue',
        assignedUsers: ['Mechanic Ali', 'Supervisor Khan']
      },
      {
        id: 'sub-2',
        name: 'Tire Problem',
        assignedUsers: ['Mechanic Raza']
      },
      {
        id: 'sub-3',
        name: 'Body Damage',
        assignedUsers: ['Workshop Team A']
      },
      {
        id: 'sub-4',
        name: 'Battery Issue',
        assignedUsers: ['Electrician Asif']
      }
    ]
  },
  {
    id: 'cat-2',
    name: 'Operations',
    code: 'OPS',
    subCategories: [
      {
        id: 'sub-5',
        name: 'Late Departure',
        assignedUsers: ['Ops Manager Hamza', 'Route Supervisor Bilal']
      },
      {
        id: 'sub-6',
        name: 'Route Change',
        assignedUsers: ['Ops Team Lead']
      },
      {
        id: 'sub-7',
        name: 'Breakdown',
        assignedUsers: ['Emergency Team']
      }
    ]
  },
  {
    id: 'cat-3',
    name: 'Captain',
    code: 'CAP',
    subCategories: [
      {
        id: 'sub-8',
        name: 'Behavior Issue',
        assignedUsers: ['HR Team', 'Fleet Manager Usman']
      },
      {
        id: 'sub-9',
        name: 'Absent',
        assignedUsers: ['HR Team']
      },
      {
        id: 'sub-10',
        name: 'Uniform Issue',
        assignedUsers: ['Admin Staff']
      }
    ]
  },
  {
    id: 'cat-4',
    name: 'Finance',
    code: 'FIN',
    subCategories: [
      {
        id: 'sub-11',
        name: 'Payment Delay',
        assignedUsers: ['Finance Team']
      },
      {
        id: 'sub-12',
        name: 'Bonus Issue',
        assignedUsers: ['Payroll Team']
      },
      {
        id: 'sub-13',
        name: 'Invoice Problem',
        assignedUsers: ['Accounts Manager']
      }
    ]
  },
  {
    id: 'cat-5',
    name: 'Customer',
    code: 'CUS',
    subCategories: [
      {
        id: 'sub-14',
        name: 'Refund Request',
        assignedUsers: ['CS Team A', 'CS Team B']
      },
      {
        id: 'sub-15',
        name: 'Service Complaint',
        assignedUsers: ['Quality Assurance']
      }
    ]
  }
]