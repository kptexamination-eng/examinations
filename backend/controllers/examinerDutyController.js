// controllers/examinerDutyController.js
import ExaminerDuty from "../models/ExaminerDuty.js";
import Subject from "../models/Subject.js";
import { resolveUserId } from "../utils/resolveUserId.js";

export const assignExaminer = async (req, res) => {
  try {
    const { staffId, subjectId, examDate, batch, internalOrExternal } =
      req.body;

    // Map staff (mongoId or Clerk)
    const resolvedStaffId = await resolveUserId(req, staffId);

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    const duty = await ExaminerDuty.create({
      staff: resolvedStaffId,
      subject: subject._id,
      department: subject.department,
      semester: subject.semester,
      examDate,
      batch,
      internalOrExternal,
      status: "MarksEntryOpen",
    });

    res.status(201).json(duty);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to assign examiner", error: err.message });
  }
};

export const getMyExaminerDuties = async (req, res) => {
  try {
    const staffId = await resolveUserId(req);
    const duties = await ExaminerDuty.find({
      staff: staffId,
      status: { $in: ["MarksEntryOpen", "Submitted"] },
    }).populate("subject");

    res.json(duties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load examiner duties" });
  }
};
