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

    amount: Number,
    paidAmount: Number,
    balance: Number,

    isPaid: {
      type: Boolean,
      default: false,
    },
    paidOn: { type: Date, default: Date.now },
    receiptUrl: String, // optional file upload
  },
  { timestamps: true }
);

export default mongoose.model("Fee", FeeSchema);
