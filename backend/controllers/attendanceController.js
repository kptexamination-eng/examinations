import Attendance from "../models/Attendance.js";
import SubjectAllocation from "../models/SubjectAllocation.js";

// ---------------------------------------------------------------------------
// MARK ATTENDANCE
// ---------------------------------------------------------------------------
export const markAttendance = async (req, res) => {
  try {
    const { subjectAllocationId, students, date } = req.body;

    // students = [{ studentId, present }]

    const records = await Promise.all(
      students.map((s) =>
        Attendance.create({
          subjectAllocation: subjectAllocationId,
          studentId: s.studentId,
          date,
          present: s.present,
          markedBy: req.user._id,
        })
      )
    );

    res.json({ message: "Attendance marked", records });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET ATTENDANCE FOR A SUBJECT
// ---------------------------------------------------------------------------
export const getAttendance = async (req, res) => {
  try {
    const { subjectAllocationId } = req.params;

    const records = await Attendance.find({
      subjectAllocation: subjectAllocationId,
    }).populate("studentId");

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
