import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAGjpmCQpq-9fZ9Y8dIHZEm-f01qe_lB2M",
  authDomain: "civic-issue-sih-bac7e.firebaseapp.com",
  projectId: "civic-issue-sih-bac7e",
  storageBucket: "civic-issue-sih-bac7e.firebasestorage.app",
  messagingSenderId: "973217616582",
  appId: "1:973217616582:android:d8a7b4ab720e5aefa13dc7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);

export default app;
