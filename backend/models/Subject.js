import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    iaMaxMarks: {
      type: Number,
      required: true,
      default: 0,
    },
    totalAttendanceHours: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ✅ Composite unique constraint
subjectSchema.index({ code: 1, department: 1 }, { unique: true });

export default mongoose.model("Subject", subjectSchema);
