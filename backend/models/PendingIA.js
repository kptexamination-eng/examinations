import mongoose from "mongoose";

const pendingIASchema = new mongoose.Schema({
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
  ia1: Number,
  ia2: Number,
  ia3: Number,
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
});

export default mongoose.model("PendingIA", pendingIASchema);
