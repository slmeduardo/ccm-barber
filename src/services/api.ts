import { User } from "@/types/user";

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

  async checkFirstUser(): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/users/first`);
    if (!response.ok) throw new Error("Erro ao verificar primeiro usuário");
    const data = await response.json();
    return data.isFirst;
  },
};
