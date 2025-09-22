import { useState, useEffect, createContext, useContext } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  auth,
  db,
  Profile,
  requestNotificationPermission,
} from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error?: any }>;
  signInWithGoogle: () => Promise<{ error?: any }>;
  signInWithPhone: (
    phoneNumber: string
  ) => Promise<{ error?: any; confirmationResult?: ConfirmationResult }>;
  confirmPhoneSignIn: (
    confirmationResult: ConfirmationResult,
    code: string
  ) => Promise<{ error?: any }>;
  signOut: () => Promise<{ error?: any }>;
  updateUserProfile: (updates: Partial<Profile>) => Promise<{ error?: any }>;
  setupRecaptcha: (elementId: string) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recaptchaVerifier, setRecaptchaVerifier] =
    useState<RecaptchaVerifier | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchProfile(user.uid);
        // Request notification permission and update FCM token
        const fcmToken = await requestNotificationPermission();
        if (fcmToken) {
          await updateFCMToken(user.uid, fcmToken);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const profileDoc = await getDoc(doc(db, "profiles", userId));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        setProfile({
          id: profileDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Profile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const updateFCMToken = async (userId: string, fcmToken: string) => {
    try {
      await updateDoc(doc(db, "profiles", userId), {
        fcmToken,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating FCM token:", error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return {};
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update user profile
      await updateProfile(user, { displayName: fullName });

      // Create profile document
      await setDoc(doc(db, "profiles", user.uid), {
        id: user.uid,
        email,
        fullName,
        photoURL: user.photoURL || "",
        role: "user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {};
    } catch (error) {
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Add scopes for better profile information
      provider.addScope("profile");
      provider.addScope("email");
      // Set persistence to LOCAL
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const credential = GoogleAuthProvider.credentialFromResult(result);

      // Check if profile exists, create if not
      const profileDoc = await getDoc(doc(db, "profiles", user.uid));
      if (!profileDoc.exists()) {
        await setDoc(doc(db, "profiles", user.uid), {
          id: user.uid,
          email: user.email || "",
          fullName: user.displayName || "",
          photoURL: user.photoURL || "",
          role: "user",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
      } else {
        // Update profile on every login
        await updateDoc(doc(db, "profiles", user.uid), {
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
          // Update these fields in case user has changed them in Google
          fullName: user.displayName || profileDoc.data()?.fullName,
          photoURL: user.photoURL || profileDoc.data()?.photoURL,
          email: user.email || profileDoc.data()?.email,
        });
      }

      return {};
    } catch (error: any) {
      console.error("Google Sign-in Error:", error);
      return {
        error: {
          message:
            error.message || "Failed to sign in with Google. Please try again.",
          code: error.code || "unknown",
        },
      };
    }
  };

  const setupRecaptcha = (elementId: string) => {
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
    }

    const verifier = new RecaptchaVerifier(auth, elementId, {
      size: "invisible",
      callback: () => {
        console.log("reCAPTCHA solved");
      },
    });

    setRecaptchaVerifier(verifier);
  };

  const signInWithPhone = async (phoneNumber: string) => {
    try {
      if (!recaptchaVerifier) {
        throw new Error("reCAPTCHA not initialized");
      }

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifier
      );
      return { confirmationResult };
    } catch (error) {
      return { error };
    }
  };

  const confirmPhoneSignIn = async (
    confirmationResult: ConfirmationResult,
    code: string
  ) => {
    try {
      const { user } = await confirmationResult.confirm(code);

      // Check if profile exists, create if not
      const profileDoc = await getDoc(doc(db, "profiles", user.uid));
      if (!profileDoc.exists()) {
        await setDoc(doc(db, "profiles", user.uid), {
          id: user.uid,
          email: user.email || "",
          fullName: user.displayName || "User",
          photoURL: user.photoURL || "",
          role: "user",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      return {};
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      return {};
    } catch (error) {
      return { error };
    }
  };

  const updateUserProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      await updateDoc(doc(db, "profiles", user.uid), {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      return {};
    } catch (error) {
      return { error };
    }
  };

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithPhone,
    confirmPhoneSignIn,
    signOut,
    updateUserProfile,
    setupRecaptcha,
  };
}
