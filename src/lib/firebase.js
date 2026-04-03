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
  serverTimestamp,
  getDoc  // ✅ Added missing import
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5rNil6KZW2kaye5-bRoVhKM3z5UCOVTg",
  authDomain: "buscaro-crm.firebaseapp.com",
  projectId: "buscaro-crm",
  storageBucket: "buscaro-crm.firebasestorage.app",
  messagingSenderId: "366870721907",
  appId: "1:366870721907:web:b8717d59783db2be754106",
  measurementId: "G-DBMZ1LLV3M"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ==========================================
// USERS
// ==========================================

export const createUser = async (userData) => {
  try {
    const userWithTimestamp = {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, "users"), userWithTimestamp);
    console.log("User created with Firebase ID:", docRef.id);
    return { success: true, id: docRef.id, data: userWithTimestamp };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: error.message };
  }
};

export const getAllUsers = async () => {
  try {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const users = [];
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

export const getUserByEmail = async (email) => {
  try {
    const q = query(
      collection(db, "users"),
      where("email", "==", email.toLowerCase().trim())
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.warn("No Firebase document found for email:", email);
      return { success: false, error: "User not found" };
    }
    const docSnap = snapshot.docs[0];
    return { success: true, id: docSnap.id, data: docSnap.data() };
  } catch (error) {
    console.error("Error finding user by email:", error);
    return { success: false, error: error.message };
  }
};

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
// LOGIN SESSIONS
// ==========================================

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
// COMPLAINTS
// ==========================================

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
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating complaint:", error);
    return { success: false, error: error.message };
  }
};

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

export const updateComplaint = async (complaintId, updates) => {
  try {
    const complaintRef = doc(db, "complaints", complaintId);
    await updateDoc(complaintRef, { ...updates, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error("Error updating complaint:", error);
    return { success: false, error: error.message };
  }
};

export const addCommentToComplaint = async (complaintId, commentData) => {
  try {
    const commentWithMeta = { ...commentData, createdAt: serverTimestamp() };
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

// ==========================================
// CLIENTS
// ==========================================

export const createClient = async (clientData) => {
  try {
    const clientWithTimestamp = {
      ...clientData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, "clients"), clientWithTimestamp);
    console.log("Client created with Firebase ID:", docRef.id);
    return { success: true, id: docRef.id, data: clientWithTimestamp };
  } catch (error) {
    console.error("Error creating client:", error);
    return { success: false, error: error.message };
  }
};

export const getAllClients = async () => {
  try {
    const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const clients = [];
    querySnapshot.forEach((doc) => {
      clients.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date().toISOString()
      });
    });
    return { success: true, data: clients };
  } catch (error) {
    console.error("Error getting clients:", error);
    return { success: false, error: error.message };
  }
};

export const updateClient = async (clientId, updates) => {
  try {
    const clientRef = doc(db, "clients", clientId);
    await updateDoc(clientRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating client:", error);
    return { success: false, error: error.message };
  }
};

export const deleteClient = async (clientId) => {
  try {
    await deleteDoc(doc(db, "clients", clientId));
    console.log("Client deleted:", clientId);
    return { success: true };
  } catch (error) {
    console.error("Error deleting client:", error);
    return { success: false, error: error.message };
  }
};

export const getClientById = async (clientId) => {
  try {
    const clientRef = doc(db, "clients", clientId);
    const docSnap = await getDoc(clientRef);  // ✅ Now works!
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: "Client not found" };
  } catch (error) {
    console.error("Error getting client:", error);
    return { success: false, error: error.message };
  }
};