import IA from "../models/InternalMarks.js";

// ---------------------------------------------------------------------------
// UPDATE/ENTER INTERNAL MARKS
// ---------------------------------------------------------------------------
export const updateIAMarks = async (req, res) => {
  try {
    const { subjectAllocationId, studentId, ia1, ia2, ia3 } = req.body;

    const record = await IA.findOneAndUpdate(
      { subjectAllocation: subjectAllocationId, studentId },
      { ia1, ia2, ia3, updatedBy: req.user._id },
      { new: true, upsert: true }
    );

    res.json({ message: "IA updated", record });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET IA MARKS FOR A SUBJECT
// ---------------------------------------------------------------------------
export const getIAMarks = async (req, res) => {
  try {
    const { subjectAllocationId } = req.params;

    const records = await IA.find({
      subjectAllocation: subjectAllocationId,
    }).populate("studentId");

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
