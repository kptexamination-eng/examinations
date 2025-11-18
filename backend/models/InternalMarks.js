import mongoose from "mongoose";

const iaSchema = new mongoose.Schema({
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
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

export default mongoose.model("IA", iaSchema);
