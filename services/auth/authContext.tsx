import React, { createContext, useContext } from "react";
import { User } from "@/types/user";
import { observer } from "mobx-react-lite";
import { useStore } from "@/stores";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = observer(
  ({ children }) => {
    const { authStore } = useStore();

    const value: AuthContextType = {
      user: authStore.user as User | null,
      loading: authStore.loading,
      signIn: authStore.signIn.bind(authStore),
      signUp: async (email: string, password: string, userData: any) => {
        await authStore.signUp(email, password);
        // TODO: Handle additional user data if needed
      },
      signOut: authStore.signOut.bind(authStore),
      isAuthenticated: authStore.isAuthenticated,
      error: authStore.error,
    };

    return (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
  }
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
