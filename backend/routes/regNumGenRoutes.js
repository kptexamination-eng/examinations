import express from "express";
import {
  getPendingStudents,
  generateRegisterNumber,
  generateBulkRegisterNumbers,
} from "../controllers/regNumGenController.js";

import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateUser);

// List students with no register number
router.get("/pending", getPendingStudents);

// Generate for one student
router.post("/generate", generateRegisterNumber);

// Generate for all students
router.post("/generate-bulk", generateBulkRegisterNumbers);

export default router;
