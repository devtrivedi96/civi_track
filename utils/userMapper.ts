import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { User, UserRole } from "@/types/user";

export const mapFirebaseUserToUser = (
  firebaseUser: FirebaseAuthTypes.User
): User => {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || "",
    name: firebaseUser.displayName || "",
    phone: firebaseUser.phoneNumber || undefined,
    role: UserRole.USER, // Default role for new users
    isVerified: firebaseUser.emailVerified,
    createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
    lastLogin: new Date(firebaseUser.metadata.lastSignInTime || Date.now()),
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
};
