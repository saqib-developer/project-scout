// config.js

// Import the functions you need from the Firebase SDKs
import { initializeApp } from "firebase/app";
import { isSupported, getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAitg_ZCEIPOhb6R7l_SOo4vpuhzjwKGQQ",
  authDomain: "proposal-scout.firebaseapp.com",
  databaseURL: "https://proposal-scout-default-rtdb.firebaseio.com",
  projectId: "proposal-scout",
  storageBucket: "proposal-scout.appspot.com",
  messagingSenderId: "561559952969",
  appId: "1:561559952969:web:09dce9fdf59c2dca146998",
  measurementId: "G-V3607WBKEX",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser, if supported)
import type { Analytics } from "firebase/analytics";

let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Initialize other Firebase services
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage };
