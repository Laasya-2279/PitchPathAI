import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDLUKiySFSpAC3b44uSzL1UPUJw3HJdS2k",
  authDomain: "pitchpath--ai.firebaseapp.com",
  projectId: "pitchpath--ai",
  storageBucket: "pitchpath--ai.firebasestorage.app",
  messagingSenderId: "683602735530",
  appId: "1:683602735530:web:a96b5dce90250def21bbd3",
  databaseURL: "https://pitchpath--ai-default-rtdb.firebaseio.com" // Standard naming, user didn't specify so we assume default
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);
const auth = getAuth(app);

// Analytics (optional based on support)
let analytics;
isSupported().then(yes => {
  if (yes) analytics = getAnalytics(app);
});

export { app, db, auth, analytics };
