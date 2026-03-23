import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB5rNil6KZW2kaye5-bRoVhKM3z5UCOVTg",
  authDomain: "buscaro-crm.firebaseapp.com",
  projectId: "buscaro-crm",
  storageBucket: "buscaro-crm.firebasestorage.app",
  messagingSenderId: "366870721907",
  appId: "1:366870721907:web:b8717d59783db2be754106",
  measurementId: "G-DBMZ1LLV3M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// ==========================================
// USERS COLLECTION FUNCTIONS
// ==========================================

// 1. USER CREATE/SAVE KARNA
export const createUser = async (userData) => {
  try {
    const userWithTimestamp = {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, "users"), userWithTimestamp);
    console.log("User created with ID:", docRef.id);
    return { success: true, id: docRef.id, data: userWithTimestamp };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: error.message };
  }
};

// 2. SAARE USERS GET KARNA
export const getAllUsers = async () => {
  try {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const users = []; // ✅ IMPORTANT

    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt || new Date().toISOString()
      });
    });

    return { success: true, data: users };

  } catch (error) {
    console.error("Error getting users:", error);
    return { success: false, error: error.message };
  }
};

// 3. USER UPDATE KARNA
export const updateUser = async (userId, updates) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: error.message };
  }
};

// ✅ 4. USER DELETE KARNA - YE FUNCTION MISSING THA!
export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(db, "users", userId));
    console.log("User deleted:", userId);
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// LOGIN SESSIONS COLLECTION
// ==========================================

// 5. LOGIN SESSION SAVE KARNA
export const saveLoginSession = async (userData) => {
  try {
    const sessionData = {
      userId: userData.id || userData.email,
      userName: userData.name,
      userEmail: userData.email,
      userRole: userData.role,
      department: userData.department,
      loginTime: serverTimestamp(),
      ipAddress: "",
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : ''
    };
    
    const docRef = await addDoc(collection(db, "loginSessions"), sessionData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error saving login session:", error);
    return { success: false, error: error.message };
  }
};

// 6. SAARI LOGIN HISTORY GET KARNA
export const getLoginHistory = async (userId = null) => {
  try {
    let q;
    if (userId) {
      q = query(
        collection(db, "loginSessions"), 
        where("userId", "==", userId),
        orderBy("loginTime", "desc")
      );
    } else {
      q = query(collection(db, "loginSessions"), orderBy("loginTime", "desc"));
    }
    
    const querySnapshot = await getDocs(q);
    const sessions = [];
    querySnapshot.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: sessions };
  } catch (error) {
    console.error("Error getting login history:", error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// COMPLAINTS/TICKETS COLLECTION
// ==========================================

// 7. COMPLAINT CREATE KARNA
export const createComplaint = async (complaintData) => {
  try {
    const complaintWithMeta = {
      ...complaintData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: complaintData.status || 'Open',
      resolvedPercent: 0
    };
    
    const docRef = await addDoc(collection(db, "complaints"), complaintWithMeta);
    console.log("Complaint created with ID:", docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating complaint:", error);
    return { success: false, error: error.message };
  }
};

// 8. SAARI COMPLAINTS GET KARNA
export const getAllComplaints = async () => {
  try {
    const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const complaints = [];
    querySnapshot.forEach((doc) => {
      complaints.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: complaints };
  } catch (error) {
    console.error("Error getting complaints:", error);
    return { success: false, error: error.message };
  }
};

// 9. SPECIFIC USER KI COMPLAINTS GET KARNA
export const getUserComplaints = async (userId) => {
  try {
    const q = query(
      collection(db, "complaints"),
      where("submittedById", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const complaints = [];
    querySnapshot.forEach((doc) => {
      complaints.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: complaints };
  } catch (error) {
    console.error("Error getting user complaints:", error);
    return { success: false, error: error.message };
  }
};

// 10. COMPLAINT UPDATE KARNA
export const updateComplaint = async (complaintId, updates) => {
  try {
    const complaintRef = doc(db, "complaints", complaintId);
    await updateDoc(complaintRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating complaint:", error);
    return { success: false, error: error.message };
  }
};

// 11. COMMENT ADD KARNA
export const addCommentToComplaint = async (complaintId, commentData) => {
  try {
    const commentWithMeta = {
      ...commentData,
      createdAt: serverTimestamp()
    };
    
    const commentsRef = collection(db, "complaints", complaintId, "comments");
    const docRef = await addDoc(commentsRef, commentWithMeta);
    
    await updateDoc(doc(db, "complaints", complaintId), {
      updatedAt: serverTimestamp(),
      lastCommentAt: serverTimestamp()
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding comment:", error);
    return { success: false, error: error.message };
  }
};

// 12. COMPLAINT KI SAARE COMMENTS GET KARNA
export const getComplaintComments = async (complaintId) => {
  try {
    const q = query(
      collection(db, "complaints", complaintId, "comments"),
      orderBy("createdAt", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const comments = [];
    querySnapshot.forEach((doc) => {
      comments.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: comments };
  } catch (error) {
    console.error("Error getting comments:", error);
    return { success: false, error: error.message };
  }
};