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
    const { page = "1", limit = "20", search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const listUsersResult = await adminAuth.listUsers(limitNum, pageNum);
    let users = listUsersResult.users.map((user) => ({
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName,
      role: (user.customClaims?.role as "admin" | "user") || "user",
      createdAt: user.metadata.creationTime,
    }));

    if (search) {
      const searchLower = (search as string).toLowerCase();
      users = users.filter(
        (user) =>
          user.email.toLowerCase().includes(searchLower) ||
          user.displayName?.toLowerCase().includes(searchLower)
      );
    }

    res.status(200).json({
      users,
      total: listUsersResult.pageToken ? limitNum + 1 : limitNum,
    });
  } catch (error) {
    console.error("Error listing users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
