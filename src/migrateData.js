// ==========================================
// DATA MIGRATION SCRIPT - LocalStorage to Firebase
// ==========================================

import { 
  createUser, 
  createComplaint,
  getAllUsers,
  getAllComplaints 
} from './src/lib/firebase.js';

// Default users data
const defaultUsers = [
  {
    name: 'Super Admin',
    email: 'super@buscaro.com',
    phone: '+92-300-1234567',
    password: 'admin123',
    department: 'Management',
    role: 'super_admin',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLogin: null
  },
  {
    name: 'Admin User',
    email: 'admin@buscaro.com',
    phone: '+92-300-7654321',
    password: 'admin123',
    department: 'HR',
    role: 'admin',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLogin: null
  },
  {
    name: 'Ops User',
    email: 'ops@buscaro.com',
    phone: '+92-300-1112223',
    password: 'admin123',
    department: 'Operations',
    role: 'ops',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLogin: null
  }
];

// ==========================================
// USERS MIGRATION
// ==========================================

export const migrateUsers = async () => {
  console.log('🔄 MIGRATING USERS...');
  
  try {
    // Check if users already exist in Firebase
    const existingUsers = await getAllUsers();
    if (existingUsers.success && existingUsers.data.length > 0) {
      console.log(`✅ Firebase already has ${existingUsers.data.length} users`);
      console.log('Skipping user migration to avoid duplicates');
      return { success: true, skipped: true, count: existingUsers.data.length };
    }

    // Get users from localStorage
    const savedUsers = localStorage.getItem('users');
    let usersToMigrate = [];
    
    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          usersToMigrate = parsed;
        }
      } catch (e) {
        console.error('Error parsing localStorage users:', e);
      }
    }
    
    // If no users in localStorage, use defaults
    if (usersToMigrate.length === 0) {
      console.log('No users in localStorage, using defaults');
      usersToMigrate = defaultUsers;
    }

    console.log(`Found ${usersToMigrate.length} users to migrate`);

    // Migrate each user
    let successCount = 0;
    let failCount = 0;
    
    for (const user of usersToMigrate) {
      try {
        // Remove local ID if exists (Firebase will create new one)
        const { id, ...userData } = user;
        
        const result = await createUser(userData);
        if (result.success) {
          successCount++;
          console.log(`✅ Migrated user: ${userData.email}`);
        } else {
          failCount++;
          console.error(`❌ Failed to migrate user: ${userData.email}`, result.error);
        }
      } catch (error) {
        failCount++;
        console.error(`❌ Error migrating user ${user.email}:`, error);
      }
    }

    console.log(`\n📊 USERS MIGRATION COMPLETE:`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    
    return { success: true, migrated: successCount, failed: failCount };
    
  } catch (error) {
    console.error('❌ Users migration failed:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// COMPLAINTS MIGRATION
// ==========================================

export const migrateComplaints = async () => {
  console.log('🔄 MIGRATING COMPLAINTS...');
  
  try {
    // Check if complaints already exist in Firebase
    const existingComplaints = await getAllComplaints();
    if (existingComplaints.success && existingComplaints.data.length > 0) {
      console.log(`✅ Firebase already has ${existingComplaints.data.length} complaints`);
      console.log('Skipping complaint migration to avoid duplicates');
      return { success: true, skipped: true, count: existingComplaints.data.length };
    }

    // Get complaints from localStorage
    const savedComplaints = localStorage.getItem('complaints');
    let complaintsToMigrate = [];
    
    if (savedComplaints) {
      try {
        const parsed = JSON.parse(savedComplaints);
        if (Array.isArray(parsed) && parsed.length > 0) {
          complaintsToMigrate = parsed;
        }
      } catch (e) {
        console.error('Error parsing localStorage complaints:', e);
      }
    }
    
    if (complaintsToMigrate.length === 0) {
      console.log('No complaints found in localStorage');
      return { success: true, migrated: 0 };
    }

    console.log(`Found ${complaintsToMigrate.length} complaints to migrate`);

    // Migrate each complaint
    let successCount = 0;
    let failCount = 0;
    
    for (const complaint of complaintsToMigrate) {
      try {
        // Remove local ID if exists (Firebase will create new one)
        const { id, ...complaintData } = complaint;
        
        const result = await createComplaint(complaintData);
        if (result.success) {
          successCount++;
          console.log(`✅ Migrated complaint: ${complaintData.ticketNo || 'Unknown'}`);
        } else {
          failCount++;
          console.error(`❌ Failed to migrate complaint:`, result.error);
        }
      } catch (error) {
        failCount++;
        console.error(`❌ Error migrating complaint:`, error);
      }
    }

    console.log(`\n📊 COMPLAINTS MIGRATION COMPLETE:`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    
    return { success: true, migrated: successCount, failed: failCount };
    
  } catch (error) {
    console.error('❌ Complaints migration failed:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// FULL MIGRATION
// ==========================================

export const migrateAllData = async () => {
  console.log('========================================');
  console.log('🚀 STARTING FULL DATA MIGRATION');
  console.log('========================================\n');
  
  const startTime = Date.now();
  
  try {
    // Migrate users first
    const usersResult = await migrateUsers();
    
    // Then migrate complaints
    const complaintsResult = await migrateComplaints();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n========================================');
    console.log('✅ MIGRATION COMPLETE!');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log('========================================');
    
    return {
      success: true,
      users: usersResult,
      complaints: complaintsResult,
      duration: `${duration}s`
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// EMERGENCY RESET FUNCTION
// ==========================================

export const resetFirebaseData = async () => {
  console.log('⚠️ EMERGENCY RESET: This will not delete Firebase data');
  console.log('Firebase mein data delete karne ke liye manually console use karein');
  
  // Clear localStorage
  localStorage.removeItem('users');
  localStorage.removeItem('complaints');
  localStorage.removeItem('currentUser');
  
  console.log('✅ LocalStorage cleared');
  console.log('🔄 Reloading page with default data...');
  
  window.location.reload();
};

// ==========================================
// AUTO-MIGRATION CHECK
// ==========================================

export const checkAndMigrate = async () => {
  console.log('🔍 Checking if migration is needed...');
  
  const usersResult = await getAllUsers();
  const complaintsResult = await getAllComplaints();
  
  const hasUsers = usersResult.success && usersResult.data.length > 0;
  const hasComplaints = complaintsResult.success && complaintsResult.data.length > 0;
  
  if (hasUsers && hasComplaints) {
    console.log('✅ Firebase already has data, no migration needed');
    return { migrated: false, reason: 'Data already exists' };
  }
  
  console.log('⚠️ Firebase is empty, starting migration...');
  return await migrateAllData();
};

// Default export
export default migrateAllData;