import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBd-hJtdPgTT4OoLrVRvimu4Jtj6LbDDKQ",
  authDomain: "coding-8a5f6.firebaseapp.com",
  projectId: "coding-8a5f6",
  storageBucket: "coding-8a5f6.firebasestorage.app",
  messagingSenderId: "203495666615",
  appId: "1:203495666615:web:9b1b05925e09b774a2ee32",
  measurementId: "G-EVNYD3SWVN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };