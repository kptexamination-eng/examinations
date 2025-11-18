import express from "express";
import { updateIAMarks, getIAMarks } from "../controllers/iaController.js";
import { requireAuthWithRole } from "../middleware/auth.js";

const router = express.Router();

router.post("/", requireAuthWithRole(["Staff"]), updateIAMarks);
router.get(
  "/:subjectAllocationId",
  requireAuthWithRole(["Staff", "Student", "HOD"]),
  getIAMarks
);

export default router;
