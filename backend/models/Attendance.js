// models/Attendance.js
import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
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

    presentHours: Number, // e.g., 48 out of 60
    totalHours: Number, // from subject.totalAttendanceHours
    percentage: Number, // auto-calculated
    isEligible: Boolean,
  },
  { timestamps: true }
);

export default mongoose.model("Attendance", AttendanceSchema);
