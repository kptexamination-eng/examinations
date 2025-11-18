import mongoose from "mongoose";
import SubjectAllocation from "../models/SubjectAllocation.js";
import Subject from "../models/Subject.js";
import User from "../models/User.js";

export const createSubjectAllocation = async (req, res) => {
  try {
    const { subjectId, department, semester, section, staff } = req.body;

    // Validate staff IDs (they must be valid Mongo ObjectIds)
    for (const s of staff) {
      if (!mongoose.Types.ObjectId.isValid(s.staffId)) {
        return res.status(400).json({
          message: `Invalid staffId: ${s.staffId}`,
        });
      }
    }

    // Prevent duplicate allocation
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

    // Save allocation
    const allocation = await SubjectAllocation.create({
      subject: subjectId,
      department,
      semester,
      section,
      staff: staff.map((s) => ({
        staffId: s.staffId,
        portions: s.portions || "",
      })),
    });

    res.json({ success: true, message: "Allocation created", allocation });
  } catch (error) {
    console.error("CREATE ALLOCATION ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------------------------
// UPDATE ALLOCATION
// ---------------------------------------------------------------------------
export const updateSubjectAllocation = async (req, res) => {
  try {
    const { id } = req.params;

    let updateData = { ...req.body };

    // If staff is updated, convert ClerkId -> MongoId again
    if (updateData.staff) {
      const newStaff = [];

      for (const s of updateData.staff) {
        const mongoUser = await User.findOne({ clerkId: s.staffId });
        if (!mongoUser)
          return res.status(400).json({
            message: `No Mongo user found for staff ${s.staffId}`,
          });

        newStaff.push({
          staffId: mongoUser._id,
          portions: s.portions || "",
        });
      }

      updateData.staff = newStaff;
    }

    const allocation = await SubjectAllocation.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
      }
    );

    if (!allocation)
      return res.status(404).json({ message: "Allocation not found" });

    res.json({ success: true, message: "Allocation updated", allocation });
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
    const staffMongoId = req.user.mongoId; // ✔ use MongoId

    const allocations = await SubjectAllocation.find({
      "staff.staffId": staffMongoId,
    }).populate("subject");

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
