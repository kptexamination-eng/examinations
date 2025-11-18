import mongoose from "mongoose";

const subjectAllocationSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },

  department: {
    type: String,
    required: true,
  },

  staff: [
    {
      staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      portions: {
        type: String, // free text or even an array
        default: "", // e.g. "Units 1–2", "Modules 3–4"
      },
    },
  ],

  // Batch-wise allocation (important!)
  semester: {
    type: Number,
    required: true,
  },

  section: {
    type: String,
    default: "A", // optional: A/B/C sections
  },
});

subjectAllocationSchema.index(
  { subject: 1, semester: 1, section: 1 },
  { unique: true }
);

export default mongoose.model("SubjectAllocation", subjectAllocationSchema);
