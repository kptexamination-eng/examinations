// models/User.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    clerkId: { type: String, index: true, sparse: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: [
        "Admin",
        "Principal",
        "Registrar",
        "COE",
        "AssistantCOE",
        "ChairmanOfExams",
        "OfficeExam",
        "OfficeAdmissions",
        "OfficeFee",
        "HOD",
        "Staff",
        "MarkEntryCaseWorker",
        "Student",
      ],
      default: "Student",
    },
    department: {
      type: String,
      enum: [
        "AT", // Automobile Engineering
        "CH", // Chemical Engineering
        "CE", // Civil Engineering
        "CS", // Computer Science Engineering
        "EC", // Electronics & Communication
        "EEE", // Electrical & Electronics
        "ME", // Mechanical
        "PO", // Polymer
        "SC", // Science & English
        "EN", // allow empty (e.g. for Admins with no dept)
        "OT",
      ],
      default: "",
    },
    imageUrl: {
      type: String,
    },

    // Optional: store Cloudinary public_id for easy image replacement
    imagePublicId: {
      type: String,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model("User", userSchema);
