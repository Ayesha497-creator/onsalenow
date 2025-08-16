// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  // Your Firebase configuration should go here
  // This is just a placeholder - you'll need to replace with your actual config
  apiKey: "AIzaSyDCOi65HHQx-XZIis-eEzmbomgtWnc-h-Q",
  authDomain: "on-sale-now-dd434.firebaseapp.com",
  databaseURL: "https://on-sale-now-dd434-default-rtdb.firebaseio.com",
  projectId: "on-sale-now-dd434",
  storageBucket: "on-sale-now-dd434.firebasestorage.app",
  messagingSenderId: "451243335580",
  appId: "1:451243335580:web:3e55e9b51840242defb259",
  measurementId: "G-E0TCXCQ1PK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

const messaging = getMessaging(app);

export { app, database, auth, db, messaging, getToken, onMessage };
