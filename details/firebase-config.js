// ============================================================
// firebase-config.js
// Connects this project to your Firebase project
// This file is loaded FIRST in every HTML page
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyD87-LpwQcLajOy6lGgOMJunGnd11rn5rk",
  authDomain: "feefinder-eb594.firebaseapp.com",
  projectId: "feefinder-eb594",
  storageBucket: "feefinder-eb594.firebasestorage.app",
  messagingSenderId: "553599534095",
  appId: "1:553599534095:web:58d84bfb02a571a4f90f7a",
  measurementId: "G-EXMEF0J2VV"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Firestore instance — used everywhere to read/write data
const db = firebase.firestore();

// Auth instance — used to detect logged-in parent
const auth = firebase.auth();