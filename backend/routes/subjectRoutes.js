import express from "express";
import {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  bulkAddSubjects,
} from "../controllers/subjectController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();
router.post(
  "/bulkjson",
  authenticateUser,
  requireRole(["Admin", "HOD"]),
  bulkAddSubjects
);

// Clerk-protected routes
router.post("/addsubject", authenticateUser, createSubject);
router.get("/getsubjects", authenticateUser, getSubjects); // /getsubjects?department=CSE
router.get("/getsubject/:id", authenticateUser, getSubjectById);
router.put("/updatesubject/:id", authenticateUser, updateSubject);
router.delete("/deletesubject/:id", authenticateUser, deleteSubject);

export default router;
