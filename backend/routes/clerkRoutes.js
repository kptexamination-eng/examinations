import express from "express";
import {
  deleteClerkUser,
  getAllClerkUsers,
} from "../controllers/clerkController.js";
import { requireAuth } from "@clerk/express";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/list", authenticateUser, getAllClerkUsers);
router.delete("/:id", authenticateUser, deleteClerkUser);

export default router;
