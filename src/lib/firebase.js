import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA3lhjo0oT-ylrhexinhN7eX5-SND-1WEw",
  authDomain: "myownstudytool.firebaseapp.com",
  projectId: "myownstudytool",
  storageBucket: "myownstudytool.firebasestorage.app",
  messagingSenderId: "593771534921",
  appId: "1:593771534921:web:b8823108f9792301a33d98",
  measurementId: "G-V82X5R3R8D"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
