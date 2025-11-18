import express from "express";
import {
  createSubjectAllocation,
  updateSubjectAllocation,
  deleteSubjectAllocation,
  getAllocationsForHOD,
  getStaffAllocations,
  getStudentSubjects,
} from "../controllers/subjectAllocationController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticateUser, createSubjectAllocation);
router.put("/:id", authenticateUser, updateSubjectAllocation);
router.delete("/:id", authenticateUser, deleteSubjectAllocation);

router.get("/hod", authenticateUser, getAllocationsForHOD);
router.get("/staff", authenticateUser, getStaffAllocations);
router.get("/student", authenticateUser, getStudentSubjects);

export default router;
