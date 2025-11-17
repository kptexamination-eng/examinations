import Student from "../models/Student.js";

/* ---------------------------------------------------------
   GET PENDING STUDENTS
--------------------------------------------------------- */
export const getPendingStudents = async (req, res) => {
  try {
    const students = await Student.find({
      registerNumber: null, // no register number yet
    }).sort({ createdAt: 1 });

    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------------------------------------------------
   HELPER: Generate roll number based on admission type
--------------------------------------------------------- */
/* ---------------------------------------------------------
   HELPER: Generate roll numbers
--------------------------------------------------------- */
const generateRollNumbers = async (student) => {
  const dept = student.currentDepartment.toUpperCase();
  const admissionType = student.admissionType.toUpperCase();

  // -------------------- REGULAR --------------------
  if (admissionType === "REGULAR") {
    const count = await Student.countDocuments({
      currentDepartment: dept,
      admissionType: "REGULAR",
      originalRollNumber: { $ne: null },
    });

    const roll = (count + 1).toString().padStart(3, "0"); // 001–070
    return { originalRollNumber: roll, currentRollNumber: roll };
  }

  // -------------------- LATERAL ENTRY --------------------
  if (admissionType === "LATERAL") {
    const count = await Student.countDocuments({
      currentDepartment: dept,
      admissionType: "LATERAL",
      currentRollNumber: { $ne: null },
    });

    const roll = (701 + count).toString(); // 701+
    return { originalRollNumber: "00", currentRollNumber: roll };
  }

  // -------------------- TRANSFER --------------------
  if (admissionType === "TRANSFER") {
    const originalDept = student.originalDepartment.toUpperCase();

    // Original department regular roll
    const countOld = await Student.countDocuments({
      currentDepartment: originalDept,
      admissionType: "REGULAR",
      originalRollNumber: { $ne: null },
    });

    const originalRoll = (countOld + 1).toString().padStart(3, "0");

    // New department transfer roll (601+)
    const countNew = await Student.countDocuments({
      currentDepartment: dept,
      admissionType: "TRANSFER",
      currentRollNumber: { $ne: null },
    });

    const currentRoll = (601 + countNew).toString(); // 601–699

    return {
      originalRollNumber: originalRoll,
      currentRollNumber: currentRoll,
    };
  }
};

/* ---------------------------------------------------------
   HELPER: Build Register Number
   Format: 103 + originalDept + currentDept + admissionYear + roll
--------------------------------------------------------- */
const buildRegisterNumber = (student, roll) => {
  const collegeCode = "103";

  const partOriginal = student.originalDepartment.padStart(2, "0"); // "00" | "CS" | "ME"
  const partCurrent = student.currentDepartment; // "CS" | "ME"
  const year = student.admissionYear; // "25"

  return `${collegeCode}${partOriginal}${partCurrent}${year}${roll}`;
};

/* ---------------------------------------------------------
   GENERATE FOR ONE STUDENT
--------------------------------------------------------- */
/* ---------------------------------------------------------
   GENERATE REGISTER NUMBER FOR ONE STUDENT
--------------------------------------------------------- */
export const generateRegisterNumber = async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId)
      return res.status(400).json({ message: "studentId is required" });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const { originalRollNumber, currentRollNumber } = await generateRollNumbers(
      student
    );

    const registerNumber = buildRegisterNumber(student, currentRollNumber);

    student.originalRollNumber = originalRollNumber;
    student.currentRollNumber = currentRollNumber;
    student.registerNumber = registerNumber;

    await student.save();

    res.json({ success: true, registerNumber });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------------------------------------------------
   GENERATE FOR ALL PENDING STUDENTS
--------------------------------------------------------- */
/* ---------------------------------------------------------
   GENERATE REGISTER NUMBERS FOR ALL PENDING STUDENTS
--------------------------------------------------------- */
export const generateBulkRegisterNumbers = async (req, res) => {
  try {
    const pending = await Student.find({ registerNumber: null });

    for (let student of pending) {
      const { originalRollNumber, currentRollNumber } =
        await generateRollNumbers(student);

      const registerNumber = buildRegisterNumber(student, currentRollNumber);

      student.originalRollNumber = originalRollNumber;
      student.currentRollNumber = currentRollNumber;
      student.registerNumber = registerNumber;

      await student.save();
    }

    res.json({ success: true, count: pending.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
