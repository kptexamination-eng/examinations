import Fee from "../models/Fee.js";
import FeeTransaction from "../models/FeeTransactionSchema.js";
import Student from "../models/Student.js";

// GET /api/fees/summary?semester=3
export const getSemesterFeeSummary = async (req, res) => {
  const { semester } = req.query;

  const summary = await Fee.aggregate([
    { $match: { semester: Number(semester) } },
    {
      $group: {
        _id: "$isPaid",
        count: { $sum: 1 },
      },
    },
  ]);

  res.json(summary);
};

export const downloadReceipt = async (req, res) => {
  const txn = await FeeTransaction.findById(req.params.txnId).populate({
    path: "feeId",
    populate: { path: "studentId" },
  });

  generateReceiptPDF(res, {
    name: txn.feeId.studentId.name,
    usn: txn.feeId.studentId.registerNumber,
    semester: txn.feeId.semester,
    amount: txn.amountPaid,
  });
};

/* =========================================================
   1️⃣ INITIALIZE EXAM FEE (Admin / COE)
========================================================= */
export const initializeExamFee = async (req, res) => {
  try {
    const { semester, totalAmount } = req.body;

    if (!semester || !totalAmount) {
      return res.status(400).json({ message: "Missing data" });
    }

    const students = await Student.find({ semester });

    const ops = students.map((s) => ({
      updateOne: {
        filter: { studentId: s._id, semester },
        update: {
          $setOnInsert: {
            studentId: s._id,
            semester,
            totalAmount,
            paidAmount: 0,
            balance: totalAmount,
            isPaid: false,
          },
        },
        upsert: true,
      },
    }));

    await Fee.bulkWrite(ops);

    res.json({ success: true, message: "Exam fee initialized" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   2️⃣ PAY EXAM FEE (OfficeFee)
========================================================= */
export const payExamFee = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { semester, amountPaid, paymentMode, transactionRef } = req.body;

    if (!semester || !amountPaid || !paymentMode) {
      return res.status(400).json({ message: "Missing payment data" });
    }

    const fee = await Fee.findOne({ studentId, semester });
    if (!fee) {
      return res.status(404).json({ message: "Fee not initialized" });
    }

    if (fee.isPaid) {
      return res.status(400).json({ message: "Fee already fully paid" });
    }

    fee.paidAmount += amountPaid;
    fee.balance = fee.totalAmount - fee.paidAmount;
    fee.isPaid = fee.balance <= 0;
    fee.lastPaidOn = new Date();

    await fee.save();

    await FeeTransaction.create({
      feeId: fee._id,
      amountPaid,
      paymentMode,
      transactionRef,
      collectedBy: req.user.clerkId,
    });

    res.json({ success: true, fee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   3️⃣ GET STUDENT FEES (Student)
========================================================= */
export const getMyFees = async (req, res) => {
  try {
    const student = await Student.findOne({ clerkId: req.user.clerkId });
    if (!student) return res.json([]);

    const fees = await Fee.find({ studentId: student._id }).sort({
      semester: 1,
    });

    res.json(fees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   4️⃣ GET STUDENT FEES (Office / Admin)
========================================================= */
export const getStudentFees = async (req, res) => {
  try {
    const { studentId } = req.params;

    const fees = await Fee.find({ studentId }).sort({ semester: 1 });

    res.json(fees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   5️⃣ GET FEE TRANSACTIONS (Audit)
========================================================= */
export const getFeeTransactions = async (req, res) => {
  try {
    const { feeId } = req.params;

    const txns = await FeeTransaction.find({ feeId }).sort({
      paidOn: -1,
    });

    res.json(txns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
