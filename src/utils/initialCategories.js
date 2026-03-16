export const initialCategories = [
  {
    id: 'cat-1',
    name: 'Vehicle',
    code: 'VEH',
    subCategories: [
      {
        id: 'sub-1',
        name: 'Engine Issue',
        assignedUsers: ['Mechanic A', 'Supervisor B']
      },
      {
        id: 'sub-2',
        name: 'Tire Problem',
        assignedUsers: ['Mechanic C']
      },
      {
        id: 'sub-3',
        name: 'Body Damage',
        assignedUsers: ['Workshop Team']
      }
    ]
  },
  {
    id: 'cat-2',
    name: 'Operations',
    code: 'OPS',
    subCategories: [
      {
        id: 'sub-4',
        name: 'Late Departure',
        assignedUsers: ['Ops Manager', 'Route Supervisor']
      },
      {
        id: 'sub-5',
        name: 'Route Change',
        assignedUsers: ['Ops Team']
      }
    ]
  },
  {
    id: 'cat-3',
    name: 'Captain',
    code: 'CAP',
    subCategories: [
      {
        id: 'sub-6',
        name: 'Behavior Issue',
        assignedUsers: ['HR Team', 'Fleet Manager']
      },
      {
        id: 'sub-7',
        name: 'Absent',
        assignedUsers: ['HR Team']
      }
    ]
  },
  {
    id: 'cat-4',
    name: 'Finance',
    code: 'FIN',
    subCategories: [
      {
        id: 'sub-8',
        name: 'Payment Delay',
        assignedUsers: ['Finance Team']
      },
      {
        id: 'sub-9',
        name: 'Bonus Issue',
        assignedUsers: ['Payroll Team']
      }
    ]
  }
]