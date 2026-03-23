import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCWImG4OU_Ta_qxOocM3Sx6MKjSLQ3GB4c",
  authDomain: "studio-5838800014-636b3.firebaseapp.com",
  projectId: "studio-5838800014-636b3",
  storageBucket: "studio-5838800014-636b3.firebasestorage.app",
  messagingSenderId: "242524498196",
  appId: "1:242524498196:web:04e6b89283c1a698f5ba01"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;