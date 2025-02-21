import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyCp0xxnxtwHkJLN-xsy57tYzgqWM05IgXI",
  authDomain: "vitti2-ff436.firebaseapp.com",
  projectId: "vitti2-ff436",
  storageBucket: "vitti2-ff436.firebasestorage.app",
  messagingSenderId: "274780035739",
  appId: "1:274780035739:web:c10ec0a29e2f02c1b0c43e",
  measurementId: "G-03BS6YJL6W",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
