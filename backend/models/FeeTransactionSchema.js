import mongoose from "mongoose";

const FeeTransactionSchema = new mongoose.Schema(
  {
    feeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fee",
      required: true,
    },

    amountPaid: {
      type: Number,
      required: true,
    },

    paymentMode: {
      type: String,
      enum: ["CASH", "UPI", "CARD", "NETBANKING"],
      required: true,
    },

    transactionRef: String,
    receiptUrl: String,

    collectedBy: {
      type: String, // clerkId of OfficeFee user
    },

    paidOn: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("FeeTransaction", FeeTransactionSchema);
