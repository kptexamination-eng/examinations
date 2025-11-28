import express from "express";
import {
  createFeeRecord,
  updateFeeStatus,
  getStudentFeeStatus,
} from "../controllers/feeController.js";

import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// OfficeFee user updates fee
router.post("/create", authenticateUser, createFeeRecord);
router.post("/update/:studentId", authenticateUser, updateFeeStatus);

// Student view
router.get("/student/my", authenticateUser, getStudentFeeStatus);

export default router;
