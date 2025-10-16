import { makeAutoObservable, runInAction } from "mobx";
import auth from "@react-native-firebase/auth";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { User } from "@/types/user";
import { mapFirebaseUserToUser } from "@/utils/userMapper";

class AuthStore {
  user: User | null = null;
  loading: boolean = true;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.initializeAuthState();
  }

  private initializeAuthState() {
    auth().onAuthStateChanged((firebaseUser) => {
      runInAction(() => {
        this.user = firebaseUser ? mapFirebaseUserToUser(firebaseUser) : null;
        this.loading = false;
      });
    });
  }

  async signIn(email: string, password: string) {
    try {
      this.loading = true;
      this.error = null;
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message;
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async signUp(email: string, password: string) {
    try {
      this.loading = true;
      this.error = null;
      await auth().createUserWithEmailAndPassword(email, password);
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message;
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async signOut() {
    try {
      this.loading = true;
      await auth().signOut();
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message;
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  get isAuthenticated() {
    return !!this.user;
  }
}

export const authStore = new AuthStore();
