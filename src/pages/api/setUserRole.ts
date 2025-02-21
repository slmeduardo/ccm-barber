import { adminAuth } from "@/lib/firebaseAdmin";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { uid, role } = req.body;

    // Verificar se o usuário que faz a requisição é admin
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (decodedToken.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Definir custom claims (role)
    await adminAuth.setCustomUserClaims(uid, { role });

    res.status(200).json({ message: "Role updated successfully" });
  } catch (error) {
    console.error("Error setting user role:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
