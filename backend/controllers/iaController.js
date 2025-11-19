import PendingIA from "../models/PendingIA.js";
import IA from "../models/InternalMarks.js";
import SubjectAllocation from "../models/SubjectAllocation.js";
import mongoose from "mongoose";
import Student from "../models/Student.js";

export const getStudentFullIA = async (req, res) => {
  try {
    console.log("========================================");
    console.log("🔵 getStudentFullIA CALLED");

    // 1) Clerk ID from token
    const clerkId = req.user?.clerkId;
    console.log("🔎 ClerkId from token:", clerkId);

    if (!clerkId) {
      console.log("❌ No clerkId found inside req.user");
      return res.json([]);
    }

    // 2) Find Student in Student collection
    const student = await Student.findOne({ clerkId });
    console.log("📌 Student lookup result:", student);

    if (!student) {
      console.log("❌ Student not found in STUDENT collection");
      return res.json([]);
    }

    console.log("✅ Student Mongo ID:", student._id.toString());
    console.log("📘 Student details:", {
      department: student.currentDepartment,
      semester: student.semester,
      section: student.section,
    });

    // 3) Fetch all subject allocations
    // 3) Fetch allocations safely even if student.section is missing
    const allocationQuery = {
      department: student.currentDepartment,
      semester: student.semester,
    };

    if (student.section) {
      allocationQuery.section = student.section;
    } else {
      console.log(
        "⚠ Student has NO section — fetching ALL sections for semester"
      );
    }

    const allocations = await SubjectAllocation.find(allocationQuery).populate(
      "subject"
    );

    console.log("📚 Allocations found:", allocations.length);

    allocations.forEach((a) =>
      console.log("➡ Allocation:", a._id.toString(), a.subject?.name)
    );

    const allocationIds = allocations.map((a) => a._id);

    // 4) Fetch final IA for student
    const finalIA = await IA.find({
      studentId: student._id,
      subjectAllocation: { $in: allocationIds },
    });

    console.log("🟢 Final IA records found:", finalIA.length);
    finalIA.forEach((i) =>
      console.log(
        "   ✔ IA:",
        i.subjectAllocation?.toString(),
        "Marks:",
        i.finalIA
      )
    );

    // 5) Fetch pending IA
    const pendingIA = await PendingIA.find({
      studentId: student._id,
      subjectAllocation: { $in: allocationIds },
      status: "Pending",
    });

    console.log("🟡 Pending IA records found:", pendingIA.length);
    pendingIA.forEach((i) =>
      console.log(
        "   ⏳ Pending:",
        i.subjectAllocation?.toString(),
        "Marks:",
        i.finalIA
      )
    );

    // 6) Build output result
    const result = allocations.map((alloc) => {
      const approved = finalIA.find(
        (i) => i.subjectAllocation.toString() === alloc._id.toString()
      );

      const pending = pendingIA.find(
        (i) => i.subjectAllocation.toString() === alloc._id.toString()
      );

      return {
        allocationId: alloc._id,
        subject: alloc.subject,
        finalIA: approved?.finalIA || null,
        maxMarks:
          approved?.maxMarks || pending?.maxMarks || alloc.subject.iaMaxMarks,
        status: approved
          ? "Approved"
          : pending
          ? "Pending Approval"
          : "Not Entered",
      };
    });

    console.log("📤 FINAL RESPONSE:", result);

    console.log("========================================\n");
    res.json(result);
  } catch (err) {
    console.log("❌ ERROR in getStudentFullIA:", err);
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------------------------------------
// HOD: Get all pending IA for selected subject (NEW & CORRECT)
// ------------------------------------------------------------
export const getPendingIABySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    // 1) Find which allocations exist for this subject
    const allocations = await SubjectAllocation.find({ subject: subjectId });

    if (allocations.length === 0) return res.json([]);

    const allocationIds = allocations.map((a) => a._id);

    // 2) Load pending IA records
    const pending = await PendingIA.find({
      subjectAllocation: { $in: allocationIds },
      status: "Pending",
    })
      .populate({
        path: "studentId",
        select: "registerNumber name clerkId",
      })
      .populate({
        path: "subjectAllocation",
        populate: { path: "staff", select: "name" },
      });

    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------------------------------------
// STAFF: Submit Pending IA
// ------------------------------------------------------------
export const submitPendingIA = async (req, res) => {
  try {
    const { subjectAllocationId, marks } = req.body;
    const submittedBy = req.user._id;

    const alloc = await SubjectAllocation.findById(
      subjectAllocationId
    ).populate("subject");

    if (!alloc)
      return res.status(404).json({ message: "Subject allocation not found" });

    const maxMarks = alloc.subject.iaMaxMarks;

    // `marks = { studentMongoId: finalIA }`
    for (const [studentId, finalIA] of Object.entries(marks)) {
      if (!mongoose.isValidObjectId(studentId)) continue;

      const isEligible = finalIA >= 0.4 * maxMarks;

      await PendingIA.findOneAndUpdate(
        { subjectAllocation: subjectAllocationId, studentId },
        {
          finalIA,
          maxMarks,
          isEligible,
          submittedBy,
          status: "Pending",
        },
        { upsert: true, new: true }
      );
    }

    res.json({ message: "IA submitted for HOD approval" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------------------------------------
// HOD: Old API but still usable
// ------------------------------------------------------------
export const getPendingIA = async (req, res) => {
  try {
    const { allocationId } = req.params;

    const pending = await PendingIA.find({
      subjectAllocation: allocationId,
      status: "Pending",
    }).populate("studentId");

    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------------------------------------
// HOD: Approve IA
// ------------------------------------------------------------
export const approveIA = async (req, res) => {
  try {
    const { pendingId } = req.params;

    const p = await PendingIA.findById(pendingId);
    if (!p) return res.status(404).json({ message: "Pending IA not found" });

    await IA.findOneAndUpdate(
      { subjectAllocation: p.subjectAllocation, studentId: p.studentId },
      {
        finalIA: p.finalIA,
        maxMarks: p.maxMarks,
        isEligible: p.isEligible,
        updatedBy: req.user._id,
      },
      { upsert: true }
    );

    p.status = "Approved";
    await p.save();

    res.json({ message: "IA Approved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------------------------------------
// HOD: Reject IA
// ------------------------------------------------------------
export const rejectIA = async (req, res) => {
  try {
    const { pendingId } = req.params;

    const p = await PendingIA.findById(pendingId);
    if (!p) return res.status(404).json({ message: "Pending IA not found" });

    p.status = "Rejected";
    await p.save();

    res.json({ message: "IA Rejected" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStudentIA = async (req, res) => {
  try {
    console.log("AUTH USER:", req.user); // DEBUG

    const clerkId = req.user.clerkId;
    console.log("Clerk ID from token:", clerkId); // DEBUG

    const student = await Student.findOne({ clerkId });
    console.log("Mongo student found:", student); // DEBUG

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const ia = await IA.find({ studentId: student._id })
      .populate({
        path: "subjectAllocation",
        populate: { path: "subject", select: "code name" },
      })
      .lean();

    console.log("IA records fetched:", ia); // DEBUG

    res.json(ia);
  } catch (err) {
    console.error("getStudentIA ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ------------------------------------------------------------
// FINAL IA list for allocation
// ------------------------------------------------------------
export const getFinalIA = async (req, res) => {
  try {
    const { allocationId } = req.params;

    const records = await IA.find({
      subjectAllocation: allocationId,
    })
      .populate("studentId", "name registerNumber clerkId")
      .lean();

    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateFinalIA = async (req, res) => {
  try {
    const { id } = req.params;

    const ia = await IA.findByIdAndUpdate(id, req.body, { new: true });

    res.json({ message: "Final IA updated", ia });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteFinalIA = async (req, res) => {
  try {
    const { id } = req.params;

    await IA.findByIdAndDelete(id);

    res.json({ message: "Final IA deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
