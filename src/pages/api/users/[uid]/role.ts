import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { uid } = req.query;
    const { role } = req.body;

    console.log("Received request:", { uid, role });

    if (!uid || !role) {
      return res.status(400).json({
        message: "Missing required fields",
        received: { uid, role },
      });
    }

    if (typeof uid !== "string") {
      return res.status(400).json({ message: "UID must be a string" });
    }

    console.log("Setting claims for UID:", uid, "Role:", role);
    await adminAuth.setCustomUserClaims(uid, { role });

    console.log("Revoking refresh tokens for UID:", uid);
    const user = await adminAuth.getUser(uid);
    await adminAuth.revokeRefreshTokens(uid);

    // Atualizar documento no Firestore usando Admin SDK
    await adminDb
      .collection("webUsers")
      .doc(uid)
      .set(
        {
          uid: uid,
          email: user.email,
          emailVerified: user.emailVerified,
          isAdmin: role === "admin",
        },
        { merge: true }
      );

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      user: {
        uid: user.uid,
        email: user.email,
        role,
        isAdmin: role === "admin",
      },
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
