import express from "express";
import {
  printAllHallTickets,
  printHallTicket,
} from "../controllers/hallTicketController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

// simple role-checking middleware for HOD
function authorizeRoles(...roles) {
  return (req, res, next) => {
    const userRole = req.user?.role; // depends on your auth middleware
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };
}

const router = express.Router();

// HOD or Admin can print
router.get(
  "/print/:studentId",
  authenticateUser,
  authorizeRoles("HOD", "Admin"),
  printHallTicket
);

router.get(
  "/print-all",
  authenticateUser,
  authorizeRoles("HOD", "Admin"),
  printAllHallTickets
);

export default router;
