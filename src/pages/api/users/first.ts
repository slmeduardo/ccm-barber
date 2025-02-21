import { adminAuth } from "@/lib/firebaseAdmin";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { users } = await adminAuth.listUsers(1);
    res.status(200).json({ isFirst: users.length === 0 });
  } catch (error) {
    console.error("Error checking first user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
