import express from "express";
import {
  markAttendance,
  getAttendance,
} from "../controllers/attendanceController.js";
import { requireAuthWithRole } from "../middleware/auth.js";

const router = express.Router();

router.post("/", requireAuthWithRole(["Staff"]), markAttendance);
router.get(
  "/:subjectAllocationId",
  requireAuthWithRole(["Staff"]),
  getAttendance
);

export default router;
