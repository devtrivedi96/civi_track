import { useState, useEffect, createContext, useContext } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  auth,
  db,
  type Profile,
  requestNotificationPermission,
} from "../lib/firebase";
import { ADMIN_EMAILS } from "../utils/adminConfig";

// Type for the auth context
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

// Create the auth context
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
// The following block is invalid and references 'email' out of scope. Remove it to fix the error.

// Removed invalid block referencing 'user' and 'email' out of scope.

const signIn = async (email: string, password: string) => {
  try {
    console.log("Starting sign in process for:", email);

    // Validate auth instance
    if (!auth.app) {
      throw new Error("Firebase auth not initialized properly");
    }

    const { user } = await signInWithEmailAndPassword(auth, email, password);
    console.log("Authentication successful for:", email);

    // Check if this is an admin email
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
    const isOfficial = email.endsWith("@civicreport.com");
    console.log("User role check:", { isAdmin, isOfficial });

    // Get or create profile
    const profileRef = doc(db, "profiles", user.uid);
    let profileDoc;
    try {
      profileDoc = await getDoc(profileRef);
      console.log("Profile fetch result:", { exists: profileDoc.exists() });
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw new Error("Failed to fetch user profile");
    }

    if (!profileDoc.exists()) {
      // Create new profile
      const newProfile = {
        id: user.uid,
        email: user.email,
        role: isAdmin ? "admin" : isOfficial ? "official" : "user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };
      console.log("Creating new profile:", {
        userId: user.uid,
        role: newProfile.role,
      });

      await setDoc(profileRef, newProfile);
    } else {
      // Get existing profile data
      const profileData = profileDoc.data();
      console.log("Existing profile found:", {
        userId: user.uid,
        currentRole: profileData.role,
      });

      // Update last login while preserving existing role
      const updates: Record<string, any> = {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Only update role if it's an admin email and current role isn't official
      if (isAdmin && profileData.role !== "official") {
        updates.role = "admin";
      }

      console.log(
        "Updating profile with:",
        updates,
        "Current profile:",
        profileData
      );
      await updateDoc(profileRef, updates);
    }

    return {};
  } catch (error) {
    console.error("Sign-in error:", error);
    return { error };
  }
};
// (Removed duplicate AuthContextType, AuthContext, and useAuth declarations)

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recaptchaVerifier, setRecaptchaVerifier] =
    useState<RecaptchaVerifier | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed. User:", user?.email);
      setUser(user);
      if (user) {
        // Check and update profile
        const profileRef = doc(db, "profiles", user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          console.log("Loaded profile data:", profileData);

          // If user is admin@civitrack.gov.in, ensure admin role
          if (
            user.email?.toLowerCase() === "admin@civitrack.gov.in" &&
            profileData.role !== "admin"
          ) {
            console.log("Updating to admin role for admin@civitrack.gov.in");
            await updateDoc(profileRef, {
              role: "admin",
              updatedAt: serverTimestamp(),
            });
            profileData.role = "admin";
          }

          // Ensure official role and department are preserved
          if (profileData.role === "official" && !profileData.department) {
            console.log(
              "Warning: Official found without department:",
              profileData
            );
          }

          console.log("Setting profile with role:", profileData.role);
          setProfile({
            id: user.uid,
            ...profileData,
            createdAt: profileData.createdAt?.toDate() || new Date(),
            updatedAt: profileData.updatedAt?.toDate() || new Date(),
          } as Profile);
        } else {
          // Create new profile
          const newProfile = {
            id: user.uid,
            email: user.email,
            fullName: user.displayName || "",
            role:
              user.email?.toLowerCase() === "admin@civitrack.gov.in"
                ? "admin"
                : "user",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(profileRef, newProfile);
          setProfile({
            ...newProfile,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Profile);
        }

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

  // Add debounce to prevent rapid FCM token updates
  const updateFCMToken = async (userId: string, fcmToken: string) => {
    try {
      const profileRef = doc(db, "profiles", userId);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        console.log("Profile not found for FCM update");
        return;
      }

      const currentData = profileSnap.data();
      if (currentData.fcmToken === fcmToken) {
        console.log("FCM token unchanged, skipping update");
        return;
      }

      console.log("Updating FCM token");
      await updateDoc(profileRef, {
        fcmToken,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating FCM token:", error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      // Get or create profile
      const profileRef = doc(db, "profiles", user.uid);
      const profileSnap = await getDoc(profileRef);
      console.log("Loading profile for user:", user.uid);

      if (!profileSnap.exists()) {
        // Create new profile for user
        const isAdmin = email.toLowerCase() === "admin@civitrack.gov.in";
        const isOfficial = email.toLowerCase().endsWith("@civicreport.com");
        const department = isOfficial ? email.split(".")[0] : undefined;

        const newProfile = {
          id: user.uid,
          email: user.email,
          fullName: user.displayName || email.split("@")[0],
          role: isAdmin ? "admin" : isOfficial ? "official" : "user",
          ...(isOfficial && { department }),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        };

        console.log("Creating new profile:", newProfile);
        await setDoc(profileRef, newProfile);
        setProfile({
          ...newProfile,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Profile);
      } else {
        // Get existing profile data
        const profileData = profileSnap.data();
        console.log("Found existing profile:", profileData);

        // Check if this is an official email but role is not set
        const isOfficial = email.toLowerCase().endsWith("@civicreport.com");
        const department = isOfficial ? email.split(".")[0] : undefined;
        const shouldBeOfficial = isOfficial && profileData.role !== "official";

        // Prepare profile updates
        const updates: Record<string, any> = {
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Update role and department if needed
        if (shouldBeOfficial) {
          console.log("Updating to official role");
          updates.role = "official";
          updates.department = department;
        } else if (profileData.role === "official") {
          console.log("Preserving existing official role and department");
          updates.role = "official";
          updates.department = profileData.department;
        }

        console.log("Updating profile with:", updates);
        await updateDoc(profileRef, updates);

        // Fetch the latest profile data after update
        const updatedProfileSnap = await getDoc(profileRef);
        if (updatedProfileSnap.exists()) {
          const updatedProfileData = updatedProfileSnap.data();
          console.log("Updated profile data:", updatedProfileData);

          // Set profile in state with latest data
          setProfile({
            id: user.uid,
            ...updatedProfileData,
            createdAt: updatedProfileData.createdAt?.toDate() || new Date(),
            updatedAt: updatedProfileData.updatedAt?.toDate() || new Date(),
          } as Profile);
        } else {
          console.error("Failed to fetch updated profile");
        }
      }

      return {};
    } catch (error: any) {
      console.error("Sign-in error:", error);
      return {
        error: {
          message:
            error.message ||
            "Failed to sign in. Please check your credentials.",
          code: error.code || "auth/unknown",
        },
      };
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
      await firebaseUpdateProfile(user, { displayName: fullName });

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
