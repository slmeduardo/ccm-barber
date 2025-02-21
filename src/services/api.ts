import { db } from "@/lib/firebase";
import { User } from "@/types/user";
import { doc, setDoc } from "firebase/firestore";

const API_BASE_URL = "/api"; // Ajuste conforme necessário

export const api = {
  async listUsers(
    page: number,
    limit: number,
    search?: string
  ): Promise<{ users: User[]; total: number }> {
    const response = await fetch(
      `${API_BASE_URL}/users?page=${page}&limit=${limit}${
        search ? `&search=${search}` : ""
      }`
    );
    if (!response.ok) throw new Error("Erro ao listar usuários");
    return response.json();
  },

  async updateUserRole(uid: string, role: "admin" | "user"): Promise<void> {
    console.log("Atualizando role do usuário:", uid, role);

    try {
      // Atualizar custom claims via API
      const response = await fetch(`${API_BASE_URL}/users/${uid}/role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || `Server error: ${response.status}`);
      }

      // Atualizar documento no Firestore
      const userRef = doc(db, "webUsers", uid);
      await setDoc(
        userRef,
        {
          isAdmin: role === "admin",
          uid,
        },
        { merge: true }
      );

      console.log("Role atualizada com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar role:", error);
      throw error;
    }
  },

  async checkFirstUser(): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/users/first`);
    if (!response.ok) throw new Error("Erro ao verificar primeiro usuário");
    const data = await response.json();
    return data.isFirst;
  },
};
