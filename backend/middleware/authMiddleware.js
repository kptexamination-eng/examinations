// src/middlewares/authMiddleware.js
import { getAuth, clerkClient } from "@clerk/express";
import User from "../models/User.js";

export const authenticateUser = async (req, res, next) => {
  try {
    const { userId } = getAuth(req); // Clerk verifies JWT here

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. No userId found." });
    }

    // Fetch full user info from Clerk
    const user = await clerkClient.users.getUser(userId);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized user" });
    }

    req.user = {
      clerkId: user.id, // ✔ correct field
      email: user.emailAddresses[0]?.emailAddress || null,
      role: user.publicMetadata?.role || null,
      department: user.publicMetadata?.department || null,
    };
    const local = await User.findOne({ clerkId: req.user.clerkId });
    if (local) req.userMongoId = local._id.toString();
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({ error: "Unauthorized request" });
  }
};
