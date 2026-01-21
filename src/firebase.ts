import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Replace with your actual Firebase project configuration
// You can copy this from the Firebase Console -> Project Settings
const firebaseConfig = {
    apiKey: "AIzaSyCtU9TdJVeCOVS0zlFtVL4QWUKS_n4jeVk",
    authDomain: "inftest-c77b1.firebaseapp.com",
    projectId: "inftest-c77b1",
    storageBucket: "inftest-c77b1.firebasestorage.app",
    messagingSenderId: "913129529745",
    appId: "1:913129529745:web:c02f0aaf6c52cc79f2ba30",
    measurementId: "G-KJQ1BMJ4FX"
};

// Initialize Firebase (SSR safe)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
