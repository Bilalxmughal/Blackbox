// firebase.js
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
  getDoc
} from "firebase/firestore";

// ===================== CONFIG =====================
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

// ===================== USERS =====================
export const createUser = async (userData) => {
  try {
    const userWithDefaults = {
      name: userData.name || userData.userName || "Unknown User",
      email: userData.email || `user${Date.now()}@example.com`,
      role: userData.role || "user",
      department: userData.department || "N/A",
      status: userData.status || "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      password: userData.password || "123456"
    };

    const docRef = await addDoc(collection(db, "users"), userWithDefaults);
    console.log("User created with Firebase ID:", docRef.id);
    return { success: true, id: docRef.id, data: userWithDefaults };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: error.message };
  }
};

export const getAllUsers = async () => {
  try {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date().toISOString()
    }));
    return { success: true, data: users };
  } catch (error) {
    console.error("Error getting users:", error);
    return { success: false, error: error.message };
  }
};

export const getUserByEmail = async (email) => {
  try {
    const q = query(collection(db, "users"), where("email", "==", email.toLowerCase().trim()));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return { success: false, error: "User not found" };
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
    await updateDoc(userRef, { ...updates, updatedAt: serverTimestamp() });
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

// ===================== LOGIN SESSIONS =====================
export const saveLoginSession = async (userData) => {
  try {
    const sessionData = {
      userId: userData.id || userData.email || "unknown",
      userName: userData.name || userData.userName || "Unknown User",
      userEmail: userData.email || "unknown@example.com",
      userRole: userData.role || "user",
      department: userData.department || "N/A",
      loginTime: serverTimestamp(),
      ipAddress: "",
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : ""
    };

    const docRef = await addDoc(collection(db, "loginSessions"), sessionData);
    console.log("Login session saved:", docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error saving login session:", error);
    return { success: false, error: error.message };
  }
};

export const getLoginHistory = async (userId = null) => {
  try {
    const q = userId 
      ? query(collection(db, "loginSessions"), where("userId", "==", userId), orderBy("loginTime", "desc"))
      : query(collection(db, "loginSessions"), orderBy("loginTime", "desc"));

    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: sessions };
  } catch (error) {
    console.error("Error getting login history:", error);
    return { success: false, error: error.message };
  }
};

// ===================== COMPLAINTS =====================
export const createComplaint = async (data) => {
  try {
    const complaint = { 
      ...data, 
      createdAt: serverTimestamp(), 
      updatedAt: serverTimestamp(),
      status: data.status || "Open",
      resolvedPercent: 0 
    };
    const docRef = await addDoc(collection(db, "complaints"), complaint);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating complaint:", error);
    return { success: false, error: error.message };
  }
};

export const getAllComplaints = async () => {
  try {
    const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const complaints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: complaints };
  } catch (error) {
    console.error("Error getting complaints:", error);
    return { success: false, error: error.message };
  }
};

export const updateComplaint = async (complaintId, updates) => {
  try {
    const ref = doc(db, "complaints", complaintId);
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error("Error updating complaint:", error);
    return { success: false, error: error.message };
  }
};

export const addCommentToComplaint = async (complaintId, commentData) => {
  try {
    const comment = { ...commentData, createdAt: serverTimestamp() };
    const commentsRef = collection(db, "complaints", complaintId, "comments");
    const docRef = await addDoc(commentsRef, comment);
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

// ===================== CLIENTS =====================
export const createClient = async (data) => {
  try {
    const client = { 
      ...data, 
      createdAt: serverTimestamp(), 
      updatedAt: serverTimestamp() 
    };
    const docRef = await addDoc(collection(db, "clients"), client);
    return { success: true, id: docRef.id, data: client };
  } catch (error) {
    console.error("Error creating client:", error);
    return { success: false, error: error.message };
  }
};

export const getAllClients = async () => {
  try {
    const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const clients = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date().toISOString()
    }));
    return { success: true, data: clients };
  } catch (error) {
    console.error("Error getting clients:", error);
    return { success: false, error: error.message };
  }
};

export const updateClient = async (clientId, updates) => {
  try {
    const ref = doc(db, "clients", clientId);
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error("Error updating client:", error);
    return { success: false, error: error.message };
  }
};

export const deleteClient = async (clientId) => {
  try {
    await deleteDoc(doc(db, "clients", clientId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting client:", error);
    return { success: false, error: error.message };
  }
};

export const getClientById = async (clientId) => {
  try {
    const ref = doc(db, "clients", clientId);
    const docSnap = await getDoc(ref);
    if (!docSnap.exists()) return { success: false, error: "Client not found" };
    return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
  } catch (error) {
    console.error("Error getting client:", error);
    return { success: false, error: error.message };
  }
};