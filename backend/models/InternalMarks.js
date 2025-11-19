import mongoose from "mongoose";

const iaSchema = new mongoose.Schema(
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

    finalIA: Number,
    maxMarks: Number,
    isEligible: Boolean,

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("IA", iaSchema);
