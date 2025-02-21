import { auth, db } from "@/lib/firebase";
import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

export type UserRole = "admin" | "user" | null;

interface AuthState {
  user: User | null;
  role: UserRole;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Verificar custom claims
          const token = await user.getIdTokenResult();
          let role = (token.claims.role as UserRole) || "user";

          // Verificar documento no Firestore
          const userDoc = await getDoc(doc(db, "webUsers", user.uid));
          if (userDoc.exists() && userDoc.data().isAdmin) {
            role = "admin";
          }

          setAuthState({ user, role, loading: false });
        } catch (error) {
          console.error("Erro ao verificar role do usuário:", error);
          setAuthState({ user, role: "user", loading: false });
        }
      } else {
        setAuthState({ user: null, role: null, loading: false });
      }
    });

    return () => unsubscribe();
  }, []);

  return authState;
};
