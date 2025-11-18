import express from "express";
import { updateIAMarks, getIAMarks } from "../controllers/iaController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticateUser, updateIAMarks);
router.get("/:subjectAllocationId", authenticateUser, getIAMarks);

export default router;
