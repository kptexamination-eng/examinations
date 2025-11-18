import mongoose from "mongoose";
import SubjectAllocation from "../models/SubjectAllocation.js";
import Subject from "../models/Subject.js";
import User from "../models/User.js";

// Returns MongoId for ANY staff identifier: MongoId OR ClerkId
async function resolveStaffId(id) {
  // Case 1: Already valid MongoId → return directly
  if (mongoose.Types.ObjectId.isValid(id)) {
    return id;
  }

  // Case 2: Clerk ID → find corresponding Mongo ID
  const mongoUser = await User.findOne({ clerkId: id });
  if (!mongoUser) return null;

  return mongoUser._id;
}
export const createSubjectAllocation = async (req, res) => {
  try {
    const { subjectId, department, semester, section, staff } = req.body;

    const mongoStaffArray = [];

    for (const s of staff) {
      const mongoId = await resolveStaffId(s.staffId);

      if (!mongoId) {
        return res.status(400).json({
          message: `Unable to resolve staffId: ${s.staffId}`,
        });
      }

      mongoStaffArray.push({
        staffId: mongoId,
        portions: s.portions || "",
      });
    }

    const exists = await SubjectAllocation.findOne({
      subject: subjectId,
      semester,
      section,
    });

    if (exists)
      return res.status(400).json({
        message: "Subject already allocated for this semester & section.",
      });

    const allocation = await SubjectAllocation.create({
      subject: subjectId,
      department,
      semester,
      section,
      staff: mongoStaffArray,
    });

    res.json({ success: true, allocation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// UPDATE ALLOCATION
// ---------------------------------------------------------------------------
export const updateSubjectAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    if (updateData.staff) {
      const newStaff = [];

      for (const s of updateData.staff) {
        const mongoId = await resolveStaffId(s.staffId);

        if (!mongoId) {
          return res.status(400).json({
            message: `Unable to resolve staffId: ${s.staffId}`,
          });
        }

        newStaff.push({
          staffId: mongoId,
          portions: s.portions || "",
        });
      }

      updateData.staff = newStaff;
    }

    const alloc = await SubjectAllocation.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!alloc)
      return res.status(404).json({ message: "Allocation not found" });

    res.json({ success: true, allocation: alloc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

    res.json({ success: true, message: "Allocation deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET ALLOCATIONS FOR HOD
// ---------------------------------------------------------------------------
export const getAllocationsForHOD = async (req, res) => {
  try {
    const { department } = req.query;

    const allocations = await SubjectAllocation.find({
      department,
    })
      .populate("subject")
      .populate({
        path: "staff.staffId",
        select: "name email clerkId imageUrl", // ⬅ include whatever you need!
      });

    res.json({ success: true, data: allocations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET ALLOCATIONS FOR STAFF (uses mongoId)
// ---------------------------------------------------------------------------
export const getStaffAllocations = async (req, res) => {
  try {
    const clerkId = req.user.clerkId;

    // Convert Clerk → Mongo
    const mongoUser = await User.findOne({ clerkId });
    if (!mongoUser)
      return res
        .status(400)
        .json({ success: false, message: "Mongo user not found for staff" });

    const allocations = await SubjectAllocation.find({
      "staff.staffId": mongoUser._id,
    }).populate("subject");

    res.json({ success: true, data: allocations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET ALLOCATIONS FOR STUDENT
// ---------------------------------------------------------------------------
export const getStudentSubjects = async (req, res) => {
  try {
    const { department, semester, section } = req.user;

    const subjects = await SubjectAllocation.find({
      department,
      semester,
      section,
    }).populate("subject");

    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
