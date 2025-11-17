import mongoose from "mongoose";

const registerCounterSchema = new mongoose.Schema(
  {
    department: { type: String, required: true }, // CS, ME, EC etc
    admissionYear: { type: String, required: true }, // "25"

    regularLastNumber: { type: Number, default: 0 }, // 1 → 001
    transferLastNumber: { type: Number, default: 600 }, // 601–699
    lateralLastNumber: { type: Number, default: 700 }, // 701–799
  },
  { timestamps: true }
);

export default mongoose.model("RegisterCounter", registerCounterSchema);
