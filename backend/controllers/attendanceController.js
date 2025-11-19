// controllers/attendanceController.js
import Attendance from "../models/Attendance.js";
import PendingAttendance from "../models/PendingAttendance.js";
import SubjectAllocation from "../models/SubjectAllocation.js";
import Student from "../models/Student.js";
import mongoose from "mongoose";

/***************************************
 * STAFF: Submit Attendance
 ***************************************/
export const submitAttendance = async (req, res) => {
  try {
    console.log("\n========== STAFF SUBMIT ATTENDANCE ==========");

    const { subjectAllocationId, attendance } = req.body;
    const submittedBy = req.user._id;

    console.log("📌 Allocation ID:", subjectAllocationId);
    console.log("📌 Attendance payload:", attendance);

    const alloc = await SubjectAllocation.findById(
      subjectAllocationId
    ).populate("subject");
    if (!alloc)
      return res.status(404).json({ message: "Invalid subject allocation" });

    console.log("📘 Allocation found:", alloc.subject.name);

    // Process each student record
    for (const [studentId, rec] of Object.entries(attendance)) {
      if (!mongoose.isValidObjectId(studentId)) continue;

      const present = rec.present;
      const total = rec.total;

      if (present == null || total == null) continue;

      const percentage = (present / total) * 100;
      const isEligible = percentage >= 75;

      console.log(`➡ Saving pending attendance for student ${studentId}`);

      await PendingAttendance.findOneAndUpdate(
        { subjectAllocation: subjectAllocationId, studentId },
        {
          presentHours: present,
          totalHours: total,
          percentage,
          isEligible,
          submittedBy,
          status: "Pending",
        },
        { upsert: true, new: true }
      );
    }

    res.json({ message: "Attendance submitted for HOD approval" });
  } catch (err) {
    console.error("❌ ERROR in submitAttendance:", err);
    res.status(500).json({ message: err.message });
  }
};

/***************************************
 * HOD: Get Pending Attendance
 ***************************************/
export const getPendingAttendance = async (req, res) => {
  try {
    const { allocationId } = req.params;

    console.log("\n========== HOD PENDING ATTENDANCE ==========");
    console.log("📘 Allocation:", allocationId);

    const pending = await PendingAttendance.find({
      subjectAllocation: allocationId,
      status: "Pending",
    }).populate("studentId");

    res.json(pending);
  } catch (err) {
    console.error("❌ ERROR getPendingAttendance:", err);
    res.status(500).json({ message: err.message });
  }
};

/***************************************
 * HOD: Approve Attendance
 ***************************************/
export const approveAttendance = async (req, res) => {
  try {
    const { pendingId } = req.params;

    console.log("\n========== HOD APPROVE ATTENDANCE ==========");

    const p = await PendingAttendance.findById(pendingId);
    if (!p)
      return res.status(404).json({ message: "Pending record not found" });

    await Attendance.findOneAndUpdate(
      {
        studentId: p.studentId,
        subjectAllocation: p.subjectAllocation,
      },
      {
        presentHours: p.presentHours,
        totalHours: p.totalHours,
        percentage: p.percentage,
        isEligible: p.isEligible,
      },
      { upsert: true, new: true }
    );

    p.status = "Approved";
    await p.save();

    res.json({ message: "Attendance Approved" });
  } catch (err) {
    console.error("❌ ERROR approveAttendance:", err);
    res.status(500).json({ message: err.message });
  }
};

/***************************************
 * STUDENT: Get Full Attendance (ALL SUBJECTS)
 ***************************************/
export const getStudentAttendance = async (req, res) => {
  try {
    console.log("\n========== STUDENT ATTENDANCE VIEW ==========");

    const clerkId = req.user.clerkId;
    console.log("🔎 Clerk ID:", clerkId);

    const student = await Student.findOne({ clerkId });
    if (!student) return res.json([]);

    console.log("📌 Student MongoID:", student._id.toString());

    // Get subjects for semester + dept + section
    const query = {
      department: student.currentDepartment,
      semester: student.semester,
    };

    if (student.section) query.section = student.section;

    const allocations = await SubjectAllocation.find(query).populate("subject");

    const allocationIds = allocations.map((a) => a._id);

    const final = await Attendance.find({
      studentId: student._id,
      subjectAllocation: { $in: allocationIds },
    });

    const pending = await PendingAttendance.find({
      studentId: student._id,
      subjectAllocation: { $in: allocationIds },
      status: "Pending",
    });

    // Build Output
    const result = allocations.map((alloc) => {
      const f = final.find(
        (x) => x.subjectAllocation.toString() === alloc._id.toString()
      );
      const p = pending.find(
        (x) => x.subjectAllocation.toString() === alloc._id.toString()
      );

      return {
        subject: alloc.subject,
        presentHours: f?.presentHours || p?.presentHours || null,
        totalHours:
          f?.totalHours || p?.totalHours || alloc.subject.totalAttendanceHours,
        percentage: f?.percentage || p?.percentage || null,
        status: f ? "Approved" : p ? "Pending Approval" : "Not Entered",
      };
    });

    res.json(result);
  } catch (err) {
    console.error("❌ ERROR getStudentAttendance:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getPendingAttendanceBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    // Step 1: Find allocations for this subject
    const allocations = await SubjectAllocation.find({ subject: subjectId });

    if (allocations.length === 0) return res.json([]);

    const allocationIds = allocations.map((a) => a._id);

    // Step 2: Find pending attendance
    const pending = await PendingAttendance.find({
      subjectAllocation: { $in: allocationIds },
      status: "Pending",
    }).populate("studentId");

    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
