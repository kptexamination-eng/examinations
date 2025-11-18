import mongoose from "mongoose";

const editRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    clerkId: { type: String, required: true },

    requestedChanges: { type: Object, required: true },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    hodRemarks: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("StudentEditRequest", editRequestSchema);
