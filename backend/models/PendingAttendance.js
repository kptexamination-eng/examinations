// models/PendingAttendance.js
import mongoose from "mongoose";

const PendingAttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    subjectAllocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubjectAllocation",
      required: true,
    },

    presentHours: Number,
    totalHours: Number,
    percentage: Number,
    isEligible: Boolean,

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // staff id (mongo)
    },

    status: {
      type: String,
      default: "Pending", // Approved / Rejected
    },
  },
  { timestamps: true }
);

export default mongoose.model("PendingAttendance", PendingAttendanceSchema);
