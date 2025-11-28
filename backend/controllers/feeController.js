import Fee from "../models/Fee.js";
import Student from "../models/Student.js";

export const createFeeRecord = async (req, res) => {
  try {
    const { studentId, semester, amount, paidAmount } = req.body;

    const balance = amount - paidAmount;
    const isPaid = balance <= 0;

    const fee = await Fee.findOneAndUpdate(
      { studentId, semester },
      { amount, paidAmount, balance, isPaid },
      { upsert: true, new: true }
    );

    res.json({ success: true, fee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateFeeStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { paidAmount } = req.body;

    const fee = await Fee.findOne({ studentId });

    if (!fee) return res.status(404).json({ message: "Fee record not found" });

    fee.paidAmount = paidAmount;
    fee.balance = fee.amount - paidAmount;
    fee.isPaid = fee.balance <= 0;

    await fee.save();

    res.json({ success: true, fee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStudentFeeStatus = async (req, res) => {
  try {
    const clerkId = req.user.clerkId;

    const student = await Student.findOne({ clerkId });
    if (!student) return res.json([]);

    const fees = await Fee.find({ studentId: student._id });

    res.json(fees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
