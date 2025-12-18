import express from "express";
import {
  initializeExamFee,
  payExamFee,
  getMyFees,
  getStudentFees,
  getFeeTransactions,
  downloadReceipt,
} from "../controllers/FeeController.js";

import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/receipt/:txnId", authenticateUser, downloadReceipt);

/* Admin / COE */
router.post("/init", authenticateUser, initializeExamFee);

/* Office Fee */
router.post("/pay/:studentId", authenticateUser, payExamFee);

/* Student */
router.get("/my", authenticateUser, getMyFees);

/* Office / Admin */
router.get("/student/:studentId", authenticateUser, getStudentFees);
router.get("/transactions/:feeId", authenticateUser, getFeeTransactions);

export default router;
