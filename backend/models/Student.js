import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true },

    // Generated later by Exam Section
    registerNumber: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
      trim: true,
    },

    // Admission type
    admissionType: {
      type: String,
      enum: ["REGULAR", "TRANSFER", "LATERAL"],
      required: true,
    },

    // Department at the time of admission
    originalDepartment: { type: String, required: true },

    // Department currently studying
    currentDepartment: { type: String, required: true },

    // Year of admission → "25"
    admissionYear: { type: String, required: true },

    // Roll numbers
    originalRollNumber: { type: String, default: null }, // 001–070
    currentRollNumber: { type: String, default: null }, // 601/701 etc

    // Basic details
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    fatherName: { type: String, required: true },
    gender: { type: String, required: true },
    category: { type: String },

    semester: { type: String, required: true },

    batch: { type: String, required: true },

    imageUrl: { type: String },
    imagePublicId: { type: String },

    role: { type: String, default: "Student" },
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
