import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCp0xxnxtwHkJLN-xsy57tYzgqWM05IgXI",
  authDomain: "vitti2-ff436.firebaseapp.com",
  projectId: "vitti2-ff436",
  storageBucket: "vitti2-ff436.firebasestorage.app",
  messagingSenderId: "274780035739",
  appId: "1:274780035739:web:c10ec0a29e2f02c1b0c43e",
  measurementId: "G-03BS6YJL6W",
};

// Inicializa o Firebase apenas se não houver uma instância existente
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);
