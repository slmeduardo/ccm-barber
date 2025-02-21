export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  role: "admin" | "user" | null;
  createdAt?: string;
}
