import express from "express";
import {
  submitAttendance,
  getPendingAttendance,
  approveAttendance,
  getStudentAttendance,
  getPendingAttendanceBySubject,
} from "../controllers/attendanceController.js";

import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// Staff submits
router.post("/submit", authenticateUser, submitAttendance);

// HOD pending list
router.get("/pending/:allocationId", authenticateUser, getPendingAttendance);

// HOD approves
router.post("/approve/:pendingId", authenticateUser, approveAttendance);
router.get(
  "/pending/subject/:subjectId",
  authenticateUser,
  getPendingAttendanceBySubject
);

// Student view
router.get("/student/my", authenticateUser, getStudentAttendance);

export default router;
