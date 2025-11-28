import express from "express";
import {
  assignQuestionPaper,
  getMyQuestionPapers,
  updateQuestionPaperBySetter,
  submitQuestionPaperToCOE,
  sendToScrutiny,
  updateQuestionPaperByScrutiny,
  approveQuestionPaper,
  sendBackToSetter,
  downloadQuestionPaper,
  getAllQuestionPapers,
  deleteQP,
  submitByScrutiny,
  getScrutinyAssignedQPs,
  getLockedQPs,
} from "../controllers/questionPaperController.js";

import { authenticateUser } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();
router.get(
  "/locked",
  authenticateUser,
  requireRole(["COE", "AssistantCOE", "ChairmanOfExams"]),
  getLockedQPs
);

router.put(
  "/:id/scrutiny/submit",
  authenticateUser,
  requireRole(["Staff", "HOD", "COE"]),
  submitByScrutiny
);

/* ----------------------------------------------------
   1️⃣ ASSIGN QP TO SETTER  (COE only)
-----------------------------------------------------*/
router.post(
  "/assign",
  authenticateUser,
  requireRole(["COE", "AssistantCOE", "ChairmanOfExams"]),
  assignQuestionPaper
);

router.get(
  "/all",
  authenticateUser,
  requireRole(["COE", "AssistantCOE", "ChairmanOfExams"]),
  getAllQuestionPapers
);

/* ----------------------------------------------------
   2️⃣ GET QP LIST FOR LOGGED-IN SETTER (SELF)
-----------------------------------------------------*/
router.get(
  "/my-qps",
  authenticateUser, // role doesn't matter, as long as logged in
  getMyQuestionPapers
);

/* ----------------------------------------------------
   3️⃣ SETTER EDITS & SUBMITS QP
-----------------------------------------------------*/

// Update sections (setter)
router.put(
  "/:id/edit",
  authenticateUser,
  requireRole(["Staff", "HOD", "COE", "AssistantCOE"]), // but controller checks setter ownership
  updateQuestionPaperBySetter
);

// Setter submits to COE
router.put(
  "/:id/submit",
  authenticateUser,
  requireRole(["Staff", "HOD", "COE", "AssistantCOE"]),
  submitQuestionPaperToCOE
);

/* ----------------------------------------------------
   4️⃣ SCRUTINY TEAM EDIT
-----------------------------------------------------*/
router.put(
  "/:id/scrutiny/edit",
  authenticateUser,
  requireRole(["Staff", "HOD", "COE", "AssistantCOE"]),
  updateQuestionPaperByScrutiny
);

/* ----------------------------------------------------
   5️⃣ COE → SEND TO SCRUTINY
-----------------------------------------------------*/
router.put(
  "/:id/send-to-scrutiny",
  authenticateUser,
  requireRole(["COE", "AssistantCOE", "ChairmanOfExams"]),
  sendToScrutiny
);

/* ----------------------------------------------------
   6️⃣ COE APPROVAL & SEND BACK
-----------------------------------------------------*/
router.put(
  "/:id/approve",
  authenticateUser,
  requireRole(["COE", "AssistantCOE", "ChairmanOfExams"]),
  approveQuestionPaper
);
router.get(
  "/scrutiny/my-qps",
  authenticateUser,
  requireRole(["Staff", "HOD", "COE", "AssistantCOE"]),
  getScrutinyAssignedQPs
);

router.put(
  "/:id/send-back",
  authenticateUser,
  requireRole(["COE", "AssistantCOE", "ChairmanOfExams"]),
  sendBackToSetter
);

/* ----------------------------------------------------
   7️⃣ DOWNLOAD (COE ONLY)
-----------------------------------------------------*/
router.get(
  "/:id/download",
  authenticateUser,
  requireRole(["COE", "AssistantCOE", "ChairmanOfExams"]),
  downloadQuestionPaper
);

router.delete("/:id", authenticateUser, requireRole(["COE"]), deleteQP);

export default router;
