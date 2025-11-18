import SubjectAllocation from "../models/SubjectAllocation.js";
import Subject from "../models/Subject.js";
import User from "../models/User.js";

// ---------------------------------------------------------------------------
// CREATE SUBJECT ALLOCATION
// ---------------------------------------------------------------------------
export const createSubjectAllocation = async (req, res) => {
  try {
    const { subjectId, department, semester, section, staff } = req.body;

    const exists = await SubjectAllocation.findOne({
      subject: subjectId,
      semester,
      section,
    });

    if (exists) {
      return res.status(400).json({
        message: "Subject already allocated for this semester & section.",
      });
    }

    const allocation = await SubjectAllocation.create({
      subject: subjectId,
      department,
      semester,
      section,
      staff,
    });

    res.json({ message: "Allocation created", allocation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------------------------
// UPDATE ALLOCATION (portion or staff changes)
// ---------------------------------------------------------------------------
export const updateSubjectAllocation = async (req, res) => {
  try {
    const { id } = req.params;

    const allocation = await SubjectAllocation.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!allocation)
      return res.status(404).json({ message: "Allocation not found" });

    res.json({ message: "Allocation updated", allocation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------------------------
// DELETE ALLOCATION
// ---------------------------------------------------------------------------
export const deleteSubjectAllocation = async (req, res) => {
  try {
    const { id } = req.params;

    const allocation = await SubjectAllocation.findByIdAndDelete(id);

    if (!allocation)
      return res.status(404).json({ message: "Allocation not found" });

    res.json({ message: "Allocation deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET ALLOCATIONS FOR HOD (by dept + sem)
// ---------------------------------------------------------------------------
export const getAllocationsForHOD = async (req, res) => {
  try {
    const { department, semester, section } = req.query;

    const allocations = await SubjectAllocation.find({
      department,
      semester,
      section,
    })
      .populate("subject")
      .populate("staff.staffId");

    res.json(allocations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET ALLOCATIONS FOR STAFF DASHBOARD
// ---------------------------------------------------------------------------
export const getStaffAllocations = async (req, res) => {
  try {
    const staffId = req.user.mongoId; // or req.user._id depending on auth
    console.log("REQ.USER:", req.user);

    const allocations = await SubjectAllocation.find({
      "staff.staffId": staffId,
    }).populate("subject"); // IMPORTANT

    res.json({ success: true, data: allocations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------------------------------------------------------------------
// GET ALLOCATIONS FOR STUDENT
// ---------------------------------------------------------------------------
export const getStudentSubjects = async (req, res) => {
  try {
    const { department, semester, section } = req.user; // student data

    const subjects = await SubjectAllocation.find({
      department,
      semester,
      section,
    }).populate("subject");

    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
