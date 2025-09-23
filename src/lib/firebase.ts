import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCh0LnJSHAhJZkr1RM3hNnJHPm43I4q0p8",
  authDomain: "civic-issue-sih-bac7e.firebaseapp.com",
  projectId: "civic-issue-sih-bac7e",
  storageBucket: "civic-issue-sih-bac7e.firebasestorage.app",
  messagingSenderId: "973217616582",
  appId: "1:973217616582:web:34bbdbdcf8e99468a13dc7",
  measurementId: "G-ZN30BENWZ9",
}; // Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize messaging (only in production)
let messaging: any = null;
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.log("Messaging not supported in this environment");
  }
}

// Emulator configuration removed - using production services
// If you want to use emulators, run: firebase emulators:start

// FCM Token and messaging functions
export const requestNotificationPermission = async () => {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });
      return token;
    }
  } catch (error) {
    console.error("Error getting notification permission:", error);
  }
  return null;
};

export const onMessageListener = () => {
  if (!messaging) return Promise.resolve();

  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};

export { messaging };

// Firestore data types
export interface Profile {
  id: string;
  email: string;
  fullName: string;
  photoURL?: string;
  role: "user" | "admin" | "agent" | "official";
  fcmToken?: string;
  department?: string;
  jurisdiction?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Official {
  id: string;
  email: string;
  fullName?: string;
  role: string;
  department: string;
  jurisdiction: string;
  status: "active" | "inactive";
  dateAdded: Date;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "submitted" | "verified" | "assigned" | "resolved";
  latitude: number;
  longitude: number;
  address?: string;
  images: Array<{
    id: string;
    data: string; // base64 encoded image data
  }>;
  thumbnail?: string; // base64 encoded thumbnail
  userId: string;
  assignedTo?: string;
  department?: string; // Department to handle the issue
  assignedOfficialId?: string; // ID of the assigned government official
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportComment {
  userDisplayName: string;
  id: string;
  reportId: string;
  userId: string;
  comment: string;
  createdAt: Date;
}

export interface StatusHistory {
  id: string;
  reportId: string;
  status: "submitted" | "verified" | "assigned" | "resolved";
  changedBy: string;
  notes?: string;
  createdAt: Date;
}
