import Subject from "../models/Subject.js";

// ✅ Create Subject
export const createSubject = async (req, res) => {
  try {
    const { code, name, semester, department, iaMaxMarks } = req.body;

    // Check if the subject code already exists for the same department
    const existing = await Subject.findOne({
      code: code.toUpperCase(),
      department: department.toUpperCase(),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Subject code "${code}" already exists for department "${department}"`,
      });
    }

    const subject = await Subject.create({
      code: code.toUpperCase(),
      name,
      semester,
      department: department.toUpperCase(),

      iaMaxMarks: iaMaxMarks ?? undefined, // use provided value or default
    });

    res.status(201).json({
      success: true,
      data: subject,
      message: "✅ Subject created successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get all Subjects (with optional department + semester filter)
export const getSubjects = async (req, res) => {
  try {
    const { role, department: hodDept } = req.user?.publicMetadata || {};
    let filter = {};

    // If HOD, restrict to their department (except Science)
    if (role === "HOD" && hodDept && hodDept.toUpperCase() !== "SC") {
      filter.department = hodDept.toUpperCase();
    }

    // Optional query filtering
    if (req.query.department) {
      filter.department = req.query.department.toUpperCase();
    }

    if (req.query.semester) {
      filter.semester = Number(req.query.semester);
    }

    const subjects = await Subject.find(filter).sort({ semester: 1, code: 1 });
    res.json({ success: true, data: subjects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get single Subject by ID
export const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res
        .status(404)
        .json({ success: false, message: "Subject not found" });
    }
    res.json({ success: true, data: subject });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Update Subject
export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, semester, department, iaMaxMarks } = req.body;

    const subject = await Subject.findByIdAndUpdate(
      id,
      {
        code: code.toUpperCase(),
        name,
        semester,
        department: department.toUpperCase(),
        iaMaxMarks: iaMaxMarks ?? undefined, // allow updating or keep existing
      },
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res
        .status(404)
        .json({ success: false, message: "Subject not found" });
    }

    res.json({
      success: true,
      data: subject,
      message: "✅ Subject updated successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Delete Subject
export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByIdAndDelete(id);

    if (!subject) {
      return res
        .status(404)
        .json({ success: false, message: "Subject not found" });
    }

    res.json({ success: true, message: "✅ Subject deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const bulkAddSubjects = async (req, res) => {
  try {
    const { subjects } = req.body;

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No subjects provided",
      });
    }

    let inserted = 0;
    let skipped = 0;
    let errors = [];

    for (const row of subjects) {
      try {
        let code = row.code?.toString().trim().toUpperCase();
        let name = row.name?.toString().trim();
        let semester = Number(row.semester);
        let department = row.department?.toString().trim().toUpperCase();

        if (!code || !name || !semester || !department) {
          errors.push({ row, reason: "Missing required fields" });
          skipped++;
          continue;
        }

        if (semester < 1 || semester > 6) {
          errors.push({ row, reason: "Invalid semester" });
          skipped++;
          continue;
        }

        // Prevent duplicates
        const exists = await Subject.findOne({ code, department });

        if (exists) {
          errors.push({ row, reason: "Duplicate subject" });
          skipped++;
          continue;
        }

        await Subject.create({
          code,
          name,
          semester,
          department,
          iaMaxMarks: 0,
        });
        inserted++;
      } catch (err) {
        errors.push({ row, reason: err.message });
        skipped++;
      }
    }

    return res.json({
      success: true,
      inserted,
      skipped,
      errors,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
