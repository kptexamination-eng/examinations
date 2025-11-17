import Student from "../models/Student.js";
import cloudinary from "../config/cloudinary.js";
import { clerkClient } from "@clerk/express";
import mongoose from "mongoose";

/* ===========================================================
   BULK ADD STUDENTS
   =========================================================== */
export const bulkAddStudents = async (req, res) => {
  try {
    const { role, department: hodDept } = req.user;
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No students provided",
      });
    }

    if (role !== "Admin" && role !== "HOD") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add students",
      });
    }

    const results = [];

    for (const s of students) {
      let {
        registerNumber,
        name,
        email,
        phone,
        department,
        semester,
        batch,
        fatherName,
        gender,
        category,
      } = s;

      // Normalize required fields
      email = email?.toLowerCase();
      department = department?.toLowerCase();
      batch = batch?.toLowerCase();
      registerNumber = registerNumber?.toUpperCase();
      name = name?.toUpperCase();
      fatherName = fatherName?.toUpperCase();
      gender = gender?.toLowerCase();

      // Validation for new fields
      if (
        !registerNumber ||
        !name ||
        !email ||
        !phone ||
        !department ||
        !semester ||
        !batch ||
        !fatherName ||
        !gender
      ) {
        results.push({
          registerNumber,
          success: false,
          message: "Missing required fields",
        });
        continue;
      }

      // HOD restrictions
      if (role === "HOD") {
        if (hodDept === "SC") {
          results.push({
            registerNumber,
            success: false,
            message: "Science HOD cannot add students",
          });
          continue;
        }
        if (department !== hodDept.toLowerCase()) {
          results.push({
            registerNumber,
            success: false,
            message: "HOD can only add students from their department",
          });
          continue;
        }
      }

      try {
        // Check Clerk existing accounts
        const existingUsers = await clerkClient.users.getUserList({
          emailAddress: [email],
          includeDeleted: true,
        });

        if (existingUsers.length > 0) {
          for (const existing of existingUsers) {
            if (existing.deletedAt) {
              await clerkClient.users.deleteUser(existing.id, {
                hardDelete: true,
              });
            }
          }

          const checkAgain = await clerkClient.users.getUserList({
            emailAddress: [email],
          });

          if (checkAgain.length > 0) {
            results.push({
              registerNumber,
              success: false,
              message: "Email already exists in Clerk.",
            });
            continue;
          }
        }

        // Create Clerk user
        const clerkUser = await clerkClient.users.createUser({
          emailAddress: [email],
          firstName: name,
          publicMetadata: { role: "Student", department, batch },
        });

        // Create Student in MongoDB
        const student = new Student({
          clerkId: clerkUser.id,
          registerNumber,
          name,
          email,
          phone,
          department,
          semester,
          batch,
          fatherName,
          gender,
          category,
          role: "Student",
        });

        await student.save();

        results.push({ registerNumber, success: true, student });
      } catch (err) {
        console.error(`Error adding student ${registerNumber}:`, err);
        results.push({
          registerNumber,
          success: false,
          message: err.message,
        });
      }
    }

    res.status(201).json({
      success: results.every((r) => r.success),
      message: results.every((r) => r.success)
        ? "Bulk add completed successfully"
        : "Bulk add partially failed",
      results,
    });
  } catch (err) {
    console.error("BulkAdd Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to add students in bulk",
    });
  }
};

/* ===========================================================
   CREATE SINGLE STUDENT
   =========================================================== */
export const createStudent = async (req, res) => {
  try {
    const { role, department: hodDept } = req.user;

    const {
      registerNumber,
      name,
      email,
      phone,
      department,
      semester,
      batch,
      fatherName,
      gender,
      category,
    } = req.body;

    if (role !== "Admin" && role !== "HOD") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add students",
      });
    }

    if (role === "HOD") {
      if (hodDept === "SC") {
        return res.status(403).json({
          success: false,
          message: "Science HOD cannot add students",
        });
      }
      if (department !== hodDept) {
        return res.status(403).json({
          success: false,
          message: "You can only add students from your department",
        });
      }
    }

    // Clerk account
    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [email],
      firstName: name,
      publicMetadata: { role: "Student", department, batch },
    });

    const student = new Student({
      clerkId: clerkUser.id,
      registerNumber,
      name: name?.toUpperCase(),
      email,
      phone,
      department,
      semester,
      batch,
      fatherName: fatherName?.toUpperCase(),
      gender,
      category,
    });

    await student.save();

    res.status(201).json({
      success: true,
      message: "Student added successfully",
      data: student,
    });
  } catch (err) {
    console.error("CreateStudent Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to add student.",
    });
  }
};

/* ===========================================================
   GET ALL STUDENTS
   =========================================================== */
export const getStudents = async (req, res) => {
  try {
    const { role, department } = req.user;

    let students;

    if (role === "Admin") {
      students = await Student.find().sort({ createdAt: -1 });
    } else if (role === "HOD" || role === "Staff") {
      if (department === "SC") {
        students = await Student.find().sort({ createdAt: -1 });
      } else {
        students = await Student.find({ department }).sort({ createdAt: -1 });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view students",
      });
    }

    res.json({ success: true, data: students });
  } catch (err) {
    console.error("GetStudents Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch students.",
    });
  }
};

/* ===========================================================
   UPDATE STUDENT
   =========================================================== */
export const updateStudent = async (req, res) => {
  try {
    const { role, department } = req.user;
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    if (
      role === "HOD" &&
      department !== "SC" &&
      student.department !== department
    ) {
      return res.status(403).json({
        success: false,
        message: "Cannot edit student outside your department",
      });
    }

    if (role === "HOD" && department === "SC") {
      return res.status(403).json({
        success: false,
        message: "Science HOD cannot modify students",
      });
    }

    const updateData = { ...req.body };

    if (req.cloudinaryResult) {
      updateData.imageUrl = req.cloudinaryResult.secure_url;
      updateData.imagePublicId = req.cloudinaryResult.public_id;
    }

    const updated = await Student.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    res.json({
      success: true,
      message: "Student updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("UpdateStudent Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to update student.",
    });
  }
};

/* ===========================================================
   DELETE STUDENT
   =========================================================== */
export const deleteStudent = async (req, res) => {
  try {
    const { role, department } = req.user;
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    if (role === "HOD" && student.department !== department) {
      return res.status(403).json({
        success: false,
        message: "HOD cannot delete student from another department.",
      });
    }

    if (role === "HOD" && department === "SC") {
      return res.status(403).json({
        success: false,
        message: "Science HOD cannot modify students",
      });
    }

    // Clerk deletion
    if (student.clerkId) {
      try {
        await clerkClient.users.deleteUser(student.clerkId);
      } catch (clerkErr) {
        // ignore if deleted
      }
    }

    // Cloudinary deletion
    if (student.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(student.imagePublicId);
      } catch (e) {}
    }

    await student.deleteOne();

    res.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (err) {
    console.error("DeleteStudent Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to delete student.",
    });
  }
};

/* ===========================================================
   GET BY ID
   =========================================================== */
export const getStudentById = async (req, res) => {
  try {
    const { role, department } = req.user;
    let studentId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      const student = await Student.findOne({ clerkId: studentId });
      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });
      }
      studentId = student._id;
    }

    const student = await Student.findById(studentId);

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    if (
      role === "HOD" &&
      department !== "SC" &&
      student.department !== department
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view students from your own department",
      });
    }

    if (role !== "Admin" && role !== "HOD") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view student",
      });
    }

    res.json({ success: true, data: student });
  } catch (err) {
    console.error("GetStudentById Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch student details.",
    });
  }
};

/* ===========================================================
   SEARCH STUDENTS
   =========================================================== */
export const searchStudents = async (req, res) => {
  try {
    const { department, semester, registerNumber, batch } = req.query;

    const filter = {};

    if (department) filter.department = department.toLowerCase();
    if (semester) filter.semester = String(semester);
    if (registerNumber) filter.registerNumber = registerNumber.toUpperCase();
    if (batch) filter.batch = batch.toLowerCase();

    const students = await Student.find(filter).select(
      "name registerNumber department semester batch fatherName gender category _id clerkId imageUrl"
    );

    res.json(students);
  } catch (err) {
    res.status(500).json({
      message: "❌ Failed to search students",
      error: err.message,
    });
  }
};

/* ===========================================================
   ATTENDANCE HISTORY
   =========================================================== */
export const getStudentAttendanceHistory = async (req, res) => {
  try {
    let { studentId, subjectId, startDate, endDate } = req.query;

    if (!studentId)
      return res.status(400).json({
        success: false,
        message: "studentId is required",
      });

    let mongoId = studentId;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      const student = await Student.findOne({ clerkId: studentId });
      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });
      }
      mongoId = student._id;
    }

    const filter = { studentId: mongoId };

    const sessionFilter = {};

    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
      sessionFilter.subjectId = subjectId;
    }

    if (startDate && endDate) {
      sessionFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const records = await AttendanceRecord.find(filter)
      .populate({
        path: "sessionId",
        match: sessionFilter,
        populate: {
          path: "subjectId",
          select: "name code semester",
        },
      })
      .populate("studentId", "name registerNumber");

    const history = records
      .filter((r) => r.sessionId)
      .map((r) => {
        const subj = r.sessionId.subjectId;
        return {
          date: r.sessionId.date,
          subject: subj?.name || "Unknown",
          code: subj?.code || "",
          timeSlot: r.sessionId.timeSlot,
          hours: r.hours || 0,
          status: r.hours > 0 ? "Present" : "Absent",
        };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      studentId: mongoId,
      history,
    });
  } catch (err) {
    console.error("getStudentAttendanceHistory Error:", err);
    res.status(500).json({
      success: false,
      message: "❌ Failed to fetch student history",
      error: err.message,
    });
  }
};
