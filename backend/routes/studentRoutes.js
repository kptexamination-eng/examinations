import express from "express";
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  searchStudents,
  bulkAddStudents,
  requestProfileEdit,
  handleEditRequest,
  getPendingEditRequests,
  deleteEditRequest,
} from "../controllers/studentController.js";

import { authenticateUser } from "../middleware/authMiddleware.js";
import { uploadSingleImage } from "../middleware/uploadImage.js"; // ✅ fixed path

const router = express.Router();

// All routes require Clerk auth
router.use(authenticateUser);

router.post(
  "/request-edit",
  authenticateUser,
  uploadSingleImage,
  requestProfileEdit
);
router.get("/edit-requests/pending", authenticateUser, getPendingEditRequests);

// HOD approves / rejects
router.post("/edit-request/:requestId", authenticateUser, handleEditRequest);
// Add student
router.post("/addstudent", uploadSingleImage, createStudent);

// Get students
router.get("/getstudents", getStudents);

// Get student by id
router.get("/getstudent/:id", getStudentById);

// Update student
router.put("/updatestudent/:id", uploadSingleImage, updateStudent);
router.delete("/edit-request/:id", authenticateUser, deleteEditRequest);

// Delete student
router.delete("/deletestudent/:id", deleteStudent);
router.get("/search", searchStudents);

router.post("/bulk-add", bulkAddStudents);
export default router;
