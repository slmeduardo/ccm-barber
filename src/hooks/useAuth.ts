import { auth } from "@/lib/firebase";
import { User } from "firebase/auth";
import { useEffect, useState } from "react";

export type UserRole = "admin" | "user" | null;

interface AuthState {
  user: User | null;

  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,

    loading: true,
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthState({ user, loading: false });
    });

    return () => unsubscribe();
  }, []);

  return authState;
};
