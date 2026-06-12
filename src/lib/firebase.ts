import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC7D9GCHQgkzQJu_VE1JflK14YIdphZPtw",
  authDomain: "saanjh-vibe.firebaseapp.com",
  projectId: "saanjh-vibe",
  storageBucket: "saanjh-vibe.firebasestorage.app",
  messagingSenderId: "580056503648",
  appId: "1:580056503648:web:c0531837249e8ea8007a05",
  measurementId: "G-L1KVBKXJGM"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
