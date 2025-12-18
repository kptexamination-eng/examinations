import mongoose from "mongoose";

const FeeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    semester: {
      type: Number,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    balance: {
      type: Number,
      default: 0,
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    lastPaidOn: Date,
  },
  { timestamps: true }
);

// prevent duplicate fee records
FeeSchema.index({ studentId: 1, semester: 1 }, { unique: true });

export default mongoose.model("Fee", FeeSchema);
