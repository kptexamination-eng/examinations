import mongoose from "mongoose";

const pendingIASchema = new mongoose.Schema(
  {
    subjectAllocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubjectAllocation",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // staff enters only this
    finalIA: { type: Number, required: true },

    maxMarks: { type: Number, required: true },

    isEligible: { type: Boolean, default: false },

    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("PendingIA", pendingIASchema);
