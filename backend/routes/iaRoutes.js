import express from "express";
import {
  submitPendingIA,
  getPendingIA,
  approveIA,
  rejectIA,
  getFinalIA,
  updateFinalIA,
  deleteFinalIA,
  getPendingIABySubject,
  getStudentIA,
  getStudentFullIA,
} from "../controllers/iaController.js";

import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// MUST COME FIRST
router.get(
  "/pending/subject/:subjectId",
  authenticateUser,
  getPendingIABySubject
);

// STAFF – submit marks (pending)
router.post("/pending", authenticateUser, submitPendingIA);

// HOD – view pending per allocation (older endpoint)
router.get("/pending/:allocationId", authenticateUser, getPendingIA);

// HOD – approve / reject
router.post("/approve/:pendingId", authenticateUser, approveIA);
router.post("/reject/:pendingId", authenticateUser, rejectIA);

// FINAL IA CRUD
router.get("/final/:allocationId", authenticateUser, getFinalIA);
router.put("/final/:id", authenticateUser, updateFinalIA);
router.delete("/final/:id", authenticateUser, deleteFinalIA);
router.get("/student/my", authenticateUser, getStudentIA);
router.get("/student/full", authenticateUser, getStudentFullIA);

export default router;
