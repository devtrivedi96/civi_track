import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { User, UserRole } from "@/types/user";

// Initialize Google Sign In
GoogleSignin.configure({
  webClientId: "973217616582-your-web-client-id.apps.googleusercontent.com", // Get this from Google Cloud Console
});

class AuthService {
  async signInWithEmailAndPassword(email: string, password: string) {
    try {
      const result = await auth().signInWithEmailAndPassword(email, password);
      await this.updateLoginTime(result.user.uid);
      return result.user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async createUserWithEmailAndPassword(
    email: string,
    password: string,
    userData: any
  ) {
    try {
      const result = await auth().createUserWithEmailAndPassword(
        email,
        password
      );

      // Create user document in Firestore
      const user: User = {
        id: result.user.uid,
        email,
        name: userData.name,
        phone: userData.phone,
        role: UserRole.USER, // New users always start as regular users
        isVerified: false,
        createdAt: new Date(),
        lastLogin: new Date(),
        points: 0,
        level: 1,
        achievements: [],
        settings: {
          notifications: {
            reportUpdates: true,
            achievements: true,
            newReports: true,
          },
          privacy: {
            showProfile: true,
            showReports: true,
          },
        },
      };

      await firestore().collection("users").doc(result.user.uid).set(user);
      return result.user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async signInWithGoogle() {
    try {
      // Check if device supports Google Play
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Sign in to Google
      await GoogleSignin.signOut(); // Clear any existing sessions
      const userInfo = await GoogleSignin.signIn();

      // Get the ID token
      const { idToken } = await GoogleSignin.getTokens();

      // Create a credential
      const credential = auth.GoogleAuthProvider.credential(idToken);

      // Sign in to Firebase
      const result = await auth().signInWithCredential(credential);

      // Create/Update user profile
      if (result && result.user) {
        await this.createOrUpdateUserProfile(result.user);
        return result.user;
      }
      return null;
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error("User cancelled the login flow");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error("Sign in is already in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error("Google Play services is not available");
      }
      throw this.handleAuthError(error);
    }
  }

  async signInWithPhoneNumber(
    phoneNumber: string
  ): Promise<FirebaseAuthTypes.ConfirmationResult> {
    try {
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
      return confirmation;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async confirmPhoneNumber(
    confirmation: FirebaseAuthTypes.ConfirmationResult,
    code: string
  ) {
    try {
      const result = await confirmation.confirm(code);
      if (result && result.user) {
        await this.createOrUpdateUserProfile(result.user);
        return result.user;
      }
      return null;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async signOut() {
    try {
      try {
        await GoogleSignin.signOut();
      } catch (error) {
        // Ignore Google Sign Out errors
        console.log("Google Sign Out Error:", error);
      }
      return auth().signOut();
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  onAuthStateChanged(callback: (user: User | null) => void) {
    return auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await firestore()
          .collection("users")
          .doc(firebaseUser.uid)
          .get();
        if (userDoc.exists()) {
          callback(userDoc.data() as User);
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  async getCurrentUser(): Promise<User | null> {
    const currentUser = auth().currentUser;
    if (currentUser) {
      const userDoc = await firestore()
        .collection("users")
        .doc(currentUser.uid)
        .get();
      return userDoc.exists() ? (userDoc.data() as User) : null;
    }
    return null;
  }

  async verifyOfficialEmail(email: string): Promise<boolean> {
    try {
      const snapshot = await firestore()
        .collection("officials")
        .where("email", "==", email)
        .where("isVerified", "==", true)
        .get();

      return !snapshot.empty;
    } catch (error) {
      console.error("Error verifying official email:", error);
      return false;
    }
  }

  async upgradeToOfficial(userId: string, department: string): Promise<void> {
    try {
      await firestore().collection("users").doc(userId).update({
        role: UserRole.OFFICIAL,
        department,
        isVerified: true,
      });
    } catch (error) {
      throw new Error("Failed to upgrade user to official status");
    }
  }

  private async createOrUpdateUserProfile(firebaseUser: any) {
    const userRef = firestore().collection("users").doc(firebaseUser.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Create new user profile
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        name: firebaseUser.displayName || "",
        phone: firebaseUser.phoneNumber || "",
        role: UserRole.USER,
        isVerified: firebaseUser.emailVerified,
        createdAt: new Date(),
        lastLogin: new Date(),
        points: 0,
        level: 1,
        achievements: [],
        settings: {
          notifications: {
            reportUpdates: true,
            achievements: true,
            newReports: true,
          },
          privacy: {
            showProfile: true,
            showReports: true,
          },
        },
      };

      // If the user's email is in the officials list, upgrade them
      if (firebaseUser.email) {
        const isOfficial = await this.verifyOfficialEmail(firebaseUser.email);
        if (isOfficial) {
          const officialSnapshot = await firestore()
            .collection("officials")
            .where("email", "==", firebaseUser.email)
            .get();

          if (!officialSnapshot.empty) {
            const officialData = officialSnapshot.docs[0].data();
            user.role = UserRole.OFFICIAL;
            user.department = officialData.department;
            user.isVerified = true;
          }
        }
      }

      await userRef.set(user);
    } else {
      // Update existing user's last login
      await this.updateLoginTime(firebaseUser.uid);
    }
  }

  private async updateLoginTime(userId: string) {
    await firestore().collection("users").doc(userId).update({
      lastLogin: new Date(),
    });
  }

  private handleAuthError(error: any): Error {
    console.error("Auth Error:", error);

    // Customize error messages based on error code
    const errorMessages: { [key: string]: string } = {
      "auth/invalid-email": "Invalid email address",
      "auth/user-disabled": "Your account has been disabled",
      "auth/user-not-found": "No account found with this email",
      "auth/wrong-password": "Incorrect password",
      "auth/email-already-in-use": "Email already registered",
      "auth/invalid-phone-number": "Invalid phone number",
      "auth/invalid-verification-code": "Invalid verification code",
      "auth/quota-exceeded": "SMS quota exceeded. Please try again later",
      "auth/too-many-requests": "Too many attempts. Please try again later",
    };

    const errorMessage =
      errorMessages[error.code] || error.message || "Authentication failed";
    return new Error(errorMessage);
  }
}

export const authService = new AuthService();
export { storage, firestore };
