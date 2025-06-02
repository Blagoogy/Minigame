// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore} from "firebase/firestore"
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCmF1W5_Bhy8yStL844UoIXX4G-3xFlc9Y",
  authDomain: "databaseproject-dff16.firebaseapp.com",
  projectId: "databaseproject-dff16",
  storageBucket: "databaseproject-dff16.firebasestorage.app",
  messagingSenderId: "182900958782",
  appId: "1:182900958782:web:ba78f42393c2ee2786d36f",
  measurementId: "G-KCHCBKTG3E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth =getAuth(app);