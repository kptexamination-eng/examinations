import Student from "../models/Student.js";
import cloudinary from "../config/cloudinary.js";
import { clerkClient } from "@clerk/express";
import mongoose from "mongoose";
import StudentEditRequest from "../models/StudentEditRequest.js";

/* ===========================================================
   STUDENT → REQUEST EDIT
=========================================================== */
export const requestProfileEdit = async (req, res) => {
  try {
    const { clerkId } = req.user;
    const changes = { ...req.body };

    const student = await Student.findOne({ clerkId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // If image was uploaded
    if (req.cloudinaryResult) {
      changes.imageUrl = req.cloudinaryResult.secure_url;
      changes.imagePublicId = req.cloudinaryResult.public_id;
    }

    const newRequest = await StudentEditRequest.create({
      studentId: student._id,
      clerkId,
      requestedChanges: changes,
    });

    res.json({
      success: true,
      message: "Edit request submitted for HOD approval",
      data: newRequest,
    });
  } catch (err) {
    console.error("Edit Request Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
/* ===========================================================
   DELETE EDIT REQUEST (HOD only)
=========================================================== */
export const deleteEditRequest = async (req, res) => {
  try {
    const { role } = req.user;

    if (role !== "HOD") {
      return res.status(403).json({
        success: false,
        message: "Only HOD can delete requests",
      });
    }

    const { id } = req.params;

    const deleted = await StudentEditRequest.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    return res.json({
      success: true,
      message: "Edit request deleted successfully",
    });
  } catch (err) {
    console.error("Delete Edit Request Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ===========================================================
   HOD → APPROVE / REJECT EDIT REQUEST
=========================================================== */
export const handleEditRequest = async (req, res) => {
  try {
    const { role, department } = req.user;

    if (role !== "HOD") {
      return res
        .status(403)
        .json({ success: false, message: "Only HOD allowed" });
    }

    const { requestId } = req.params;
    const { action, remarks } = req.body;

    const request = await StudentEditRequest.findById(requestId).populate(
      "studentId"
    );

    if (!request)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });

    // Department restriction
    if (request.studentId.currentDepartment !== department.toUpperCase()) {
      return res.status(403).json({
        success: false,
        message: "HOD cannot approve other department students",
      });
    }

    // --- APPROVE ---
    if (action === "APPROVE") {
      await Student.findByIdAndUpdate(
        request.studentId._id,
        request.requestedChanges,
        { new: true }
      );
    }

    // DELETE REQUEST AFTER PROCESSING
    await request.deleteOne();

    res.json({
      success: true,
      message: `Request ${action.toLowerCase()} and removed`,
    });
  } catch (err) {
    console.error("Handle Edit Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPendingEditRequests = async (req, res) => {
  try {
    const { role, department } = req.user;

    if (role !== "HOD")
      return res
        .status(403)
        .json({ success: false, message: "Only HOD allowed" });

    const dept = department.toUpperCase();

    const requests = await StudentEditRequest.find({ status: "PENDING" })
      .populate("studentId")
      .sort({ createdAt: 1 });

    // Filter by department
    const filtered = requests.filter(
      (r) => r.studentId.currentDepartment === dept
    );

    res.json({ success: true, data: filtered });
  } catch (err) {
    console.error("Fetch Pending Requests Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===========================================================
   BULK ADD STUDENTS
   =========================================================== */
export const bulkAddStudents = async (req, res) => {
  try {
    const { role, department: hodDeptRaw } = req.user;
    const hodDept = hodDeptRaw?.toUpperCase();

    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No students provided",
      });
    }

    const results = [];

    for (const s of students) {
      try {
        let {
          name,
          email,
          phone,
          currentDepartment,
          originalDepartment,
          semester,
          batch,
          fatherName,
          motherName,
          gender,
          category,
          admissionType,
        } = s;

        // Normalize
        name = name?.toUpperCase();
        fatherName = fatherName?.toUpperCase();
        motherName = motherName?.toUpperCase();
        gender = gender?.toUpperCase();
        category = category?.toUpperCase();
        currentDepartment = currentDepartment?.toUpperCase();
        originalDepartment = originalDepartment?.toUpperCase();
        admissionType = admissionType?.toUpperCase();

        if (
          !name ||
          !email ||
          !phone ||
          !currentDepartment ||
          !semester ||
          !batch ||
          !fatherName ||
          !motherName ||
          !gender ||
          !admissionType
        ) {
          results.push({ email, success: false, message: "Missing fields" });
          continue;
        }

        // HOD Restriction
        if (role === "HOD" && hodDept !== currentDepartment) {
          results.push({
            email,
            success: false,
            message: `HOD can add only ${hodDept} department students`,
          });
          continue;
        }

        // Department assignment
        if (admissionType === "REGULAR" || admissionType === "LATERAL") {
          originalDepartment = "00";
        } else if (admissionType === "TRANSFER") {
          if (!originalDepartment || originalDepartment === "00") {
            results.push({
              email,
              success: false,
              message: "Original department required for transfer student",
            });
            continue;
          }
        }

        const admissionYear = batch.toString().slice(-2);

        // Create Clerk user
        let clerkUser;
        try {
          clerkUser = await clerkClient.users.createUser({
            emailAddress: [email],
            firstName: name,
            publicMetadata: {
              role: "Student",
              department: currentDepartment,
              batch,
            },
          });
        } catch (err) {
          results.push({
            email,
            success: false,
            message: "Clerk error: " + err.message,
          });
          continue;
        }

        // Create Student
        try {
          await Student.create({
            clerkId: clerkUser.id,
            admissionType,
            originalDepartment,
            currentDepartment,
            admissionYear,

            name,
            email,
            phone,
            semester,
            batch,
            fatherName,
            motherName,
            gender,
            category,
            role: "Student",
          });
        } catch (mongoErr) {
          // Rollback Clerk user
          try {
            await clerkClient.users.deleteUser(clerkUser.id);
          } catch {}

          results.push({
            email,
            success: false,
            message: mongoErr.message,
          });
          continue;
        }

        results.push({ email, success: true });
      } catch (err) {
        results.push({ success: false, message: err.message });
      }
    }

    const allSuccess = results.every((r) => r.success === true);

    res.json({
      success: allSuccess,
      results,
    });
  } catch (err) {
    console.error("BulkAddStudents Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===========================================================
   CREATE SINGLE STUDENT
   =========================================================== */
export const createStudent = async (req, res) => {
  try {
    const { role, department: hodDeptRaw } = req.user;
    const hodDept = hodDeptRaw?.toUpperCase();

    let {
      name,
      email,
      phone,
      currentDepartment,
      semester,
      batch,
      fatherName,
      motherName,
      gender,
      category,
      admissionType,
      originalDepartment,
    } = req.body;

    // Normalize
    currentDepartment = currentDepartment?.toUpperCase();
    admissionType = admissionType?.toUpperCase();
    fatherName = fatherName?.toUpperCase();
    motherName = motherName?.toUpperCase();
    name = name?.toUpperCase();
    gender = gender?.toUpperCase();
    category = category?.toUpperCase();

    // Permission
    if (role !== "Admin" && role !== "HOD") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (role === "HOD" && hodDept !== currentDepartment) {
      return res.status(403).json({
        success: false,
        message: `HOD can add only ${hodDept} department students`,
      });
    }

    // Admission logic
    if (admissionType === "REGULAR" || admissionType === "LATERAL") {
      originalDepartment = "00";
    } else if (admissionType === "TRANSFER") {
      if (!originalDepartment || originalDepartment === "00") {
        return res.status(400).json({
          success: false,
          message: "Original department required for transfer students",
        });
      }
      originalDepartment = originalDepartment.toUpperCase();
    }

    const admissionYear = batch.toString().slice(-2);

    // Create Clerk user
    let clerkUser;
    try {
      clerkUser = await clerkClient.users.createUser({
        emailAddress: [email],
        firstName: name,
        publicMetadata: {
          role: "Student",
          department: currentDepartment,
          batch,
        },
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to create Clerk user: " + err.message,
      });
    }

    // Create Student
    const student = new Student({
      clerkId: clerkUser.id,
      admissionType,
      originalDepartment,
      currentDepartment,
      admissionYear,

      name,
      email,
      phone,
      semester,
      batch,
      fatherName,
      motherName,
      gender,
      category,
      role: "Student",
    });

    // Image upload
    if (req.cloudinaryResult) {
      student.imageUrl = req.cloudinaryResult.secure_url;
      student.imagePublicId = req.cloudinaryResult.public_id;
    }

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
      message: err.message,
    });
  }
};

/* ===========================================================
   GET STUDENTS
   =========================================================== */
export const getStudents = async (req, res) => {
  try {
    const { role, department } = req.user;
    const dept = department?.toUpperCase();

    let students;

    if (role === "Admin" && role === "OfficeFee") {
      students = await Student.find().sort({ createdAt: -1 });
    } else if (role === "HOD" || role === "Staff") {
      if (dept === "SC") {
        students = await Student.find().sort({ createdAt: -1 });
      } else {
        students = await Student.find({
          currentDepartment: dept,
        }).sort({ createdAt: -1 });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===========================================================
   UPDATE STUDENT
   =========================================================== */
export const updateStudent = async (req, res) => {
  try {
    const { role, department: hodDeptRaw } = req.user;
    const hodDept = hodDeptRaw?.toUpperCase();

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // HOD limitations
    if (role === "HOD" && hodDept !== "SC") {
      if (student.currentDepartment !== hodDept) {
        return res.status(403).json({
          success: false,
          message: "HOD cannot modify other department students",
        });
      }
    }

    if (role === "HOD" && hodDept === "SC") {
      return res.status(403).json({
        success: false,
        message: "Science & English HOD cannot modify students",
      });
    }

    const updateData = { ...req.body };

    // Handle image update
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
      message: err.message,
    });
  }
};

/* ===========================================================
   DELETE STUDENT
   =========================================================== */
export const deleteStudent = async (req, res) => {
  try {
    const { role, department } = req.user;
    const dept = department?.toUpperCase();

    const student = await Student.findById(req.params.id);
    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });

    // HOD cannot delete SC
    if (role === "HOD" && dept === "SC")
      return res.status(403).json({
        success: false,
        message: "Science HOD cannot delete students",
      });

    // HOD cannot delete other depts
    if (role === "HOD" && student.currentDepartment !== dept)
      return res.status(403).json({
        success: false,
        message: `HOD cannot delete ${student.currentDepartment} students`,
      });

    // Delete Clerk
    try {
      if (student.clerkId) {
        await clerkClient.users.deleteUser(student.clerkId);
      }
    } catch (e) {}

    // Delete Image
    if (student.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(student.imagePublicId);
      } catch (e) {}
    }

    await student.deleteOne();

    res.json({ success: true, message: "Student deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===========================================================
   GET STUDENT BY ID
   =========================================================== */
/* ===========================================================
   GET STUDENT BY ID (Student Profile + Admin/HOD access)
   =========================================================== */
export const getStudentById = async (req, res) => {
  try {
    const { role, clerkId: loggedInClerkId, department } = req.user;
    const dept = department?.toUpperCase();

    let studentId = req.params.id;

    // STUDENT → Fetch own profile
    if (studentId === "me") {
      const self = await Student.findOne({ clerkId: loggedInClerkId });
      if (!self) {
        return res.status(404).json({
          success: false,
          message: "Your student profile was not found",
        });
      }
      return res.json({ success: true, data: self });
    }

    // if id is ClerkId instead of MongoId
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      const std = await Student.findOne({ clerkId: studentId });
      if (!std) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });
      }
      studentId = std._id;
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // Student allowed ONLY own profile
    if (role === "Student") {
      if (student.clerkId !== loggedInClerkId) {
        return res.status(403).json({
          success: false,
          message: "You cannot view other students",
        });
      }
      return res.json({ success: true, data: student });
    }

    // HOD restrictions
    if (role === "HOD" && dept !== "SC") {
      if (student.currentDepartment !== dept) {
        return res.status(403).json({
          success: false,
          message: "HOD cannot view other departments",
        });
      }
    }

    return res.json({ success: true, data: student });
  } catch (err) {
    console.error("GetStudentById Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
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

    if (department) filter.currentDepartment = department.toUpperCase();

    if (semester) filter.semester = String(semester);

    if (registerNumber) filter.registerNumber = registerNumber.toUpperCase();

    if (batch) filter.batch = batch.toString();

    const students = await Student.find(filter).select(
      "name registerNumber currentDepartment semester batch fatherName gender category _id clerkId imageUrl"
    );

    res.json(students);
  } catch (err) {
    res.status(500).json({
      message: "Failed to search students",
      error: err.message,
    });
  }
};
