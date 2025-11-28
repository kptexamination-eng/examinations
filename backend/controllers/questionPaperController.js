// controllers/questionPaperController.js

import QuestionPaper from "../models/QuestionPaper.js";
import Subject from "../models/Subject.js";
import User, { resolveUserId } from "../models/User.js";

export const submitByScrutiny = async (req, res) => {
  try {
    const scrutinyId = await resolveUserId(req);
    const { id } = req.params;
    const { note } = req.body;

    const qp = await QuestionPaper.findById(id);
    if (!qp) return res.status(404).json({ message: "QP not found" });

    if (qp.scrutinyStaff?.toString() !== scrutinyId) {
      return res.status(403).json({ message: "Not assigned to you" });
    }

    if (qp.status !== "UnderScrutiny") {
      return res.status(400).json({ message: "Not in scrutiny stage" });
    }

    qp.status = "SubmittedToCOEAfterScrutiny";

    qp.history.push({
      action: "SubmittedByScrutiny",
      by: scrutinyId,
      note,
    });

    await qp.save();
    res.json(qp);
  } catch (err) {
    res.status(500).json({ message: "Failed to submit", error: err.message });
  }
};

export const getScrutinyAssignedQPs = async (req, res) => {
  try {
    const userId = await resolveUserId(req);

    const qps = await QuestionPaper.find({
      scrutinyStaff: userId,
    }).populate("subject");

    res.json(qps);
  } catch (err) {
    res.status(500).json({ message: "Failed to load scrutiny QPs" });
  }
};

// ----------------------------------------------------
// ASSIGN QUESTION PAPER TO SETTER
// ----------------------------------------------------
export const assignQuestionPaper = async (req, res) => {
  try {
    const { subjectId, examType, attempt, setterId } = req.body;

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    // resolves Clerk or Mongo ID
    const resolvedSetterId = await resolveUserId(req, setterId);

    const exists = await QuestionPaper.findOne({
      subject: subjectId,
      setter: resolvedSetterId,
      examType,
      attempt,
    });

    if (exists) {
      return res.status(400).json({
        message: "This staff is already assigned for this subject!",
      });
    }

    const qp = await QuestionPaper.create({
      subject: subject._id,
      department: subject.department,
      semester: subject.semester,
      examType,
      attempt: attempt || 1,
      setter: resolvedSetterId,
      status: "Assigned",
      history: [{ action: "Assigned", by: req.userMongoId, note: "" }],
    });

    res.status(201).json(qp);
  } catch (err) {
    console.error(err);
    console.error("QP ASSIGN ERROR >>>", err);
    res.status(500).json({
      message:
        err.code === 11000
          ? "Duplicate assignment detected"
          : "Failed to assign question paper",
      error: err,
    });
  }
};

// ----------------------------------------------------
// GET QPs ASSIGNED TO CURRENT SETTER
// ----------------------------------------------------
export const getMyQuestionPapers = async (req, res) => {
  try {
    const setterId = await resolveUserId(req);

    const { department, semester, examType, status } = req.query;

    const filter = { setter: setterId };

    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);
    if (examType) filter.examType = examType;
    if (status) filter.status = status;

    const qps = await QuestionPaper.find(filter).populate("subject");

    res.json(qps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load question papers" });
  }
};

// ----------------------------------------------------
// SETTER EDITS QP (DRAFT)
// ----------------------------------------------------
export const updateQuestionPaperBySetter = async (req, res) => {
  try {
    const setterId = await resolveUserId(req);
    const { id } = req.params;
    const { sections } = req.body;

    const qp = await QuestionPaper.findById(id);
    if (!qp) return res.status(404).json({ message: "QP not found" });

    if (qp.setter.toString() !== setterId) {
      return res.status(403).json({ message: "Not your assignment" });
    }

    if (!["Assigned", "Draft", "CorrectionsRequested"].includes(qp.status)) {
      return res.status(400).json({ message: "Cannot edit in current status" });
    }
    if (["SubmittedToCOEAfterScrutiny", "ApprovedLocked"].includes(qp.status)) {
      return res
        .status(403)
        .json({ message: "QP is locked and cannot be edited" });
    }

    qp.sections = sections;
    if (qp.status === "Assigned") qp.status = "Draft";

    qp.history.push({
      action: "EditedBySetter",
      by: setterId,
      note: "",
    });

    await qp.save();
    res.json(qp);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to update QP",
      error: err.message,
    });
  }
};

// ----------------------------------------------------
// SETTER SUBMITS QP TO COE
// ----------------------------------------------------
export const submitQuestionPaperToCOE = async (req, res) => {
  try {
    const setterId = await resolveUserId(req);
    const { id } = req.params;

    const qp = await QuestionPaper.findById(id);
    if (!qp) return res.status(404).json({ message: "QP not found" });

    if (qp.setter.toString() !== setterId) {
      return res.status(403).json({ message: "Not your assignment" });
    }

    if (!["Assigned", "Draft", "CorrectionsRequested"].includes(qp.status)) {
      return res
        .status(400)
        .json({ message: "Cannot submit in current status" });
    }

    qp.status = "SubmittedToCOE";
    qp.history.push({ action: "SubmittedToCOE", by: setterId });

    await qp.save();
    res.json(qp);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to submit QP",
      error: err.message,
    });
  }
};

// ----------------------------------------------------
// COE SENDS TO SCRUTINY
// ----------------------------------------------------
export const sendToScrutiny = async (req, res) => {
  try {
    const { id } = req.params;
    const { scrutinyStaffId } = req.body;

    const qp = await QuestionPaper.findById(id);
    if (!qp) return res.status(404).json({ message: "QP not found" });

    if (qp.status !== "SubmittedToCOE") {
      return res.status(400).json({ message: "QP must be in SubmittedToCOE" });
    }

    const resolvedScrutinyId = await resolveUserId(req, scrutinyStaffId);

    qp.scrutinyStaff = resolvedScrutinyId;
    qp.status = "UnderScrutiny";

    qp.history.push({
      action: "SentToScrutiny",
      by: req.userMongoId,
    });

    await qp.save();
    res.json(qp);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to send to scrutiny",
      error: err.message,
    });
  }
};

export const getLockedQPs = async (req, res) => {
  try {
    const qps = await QuestionPaper.find({
      status: { $in: ["SubmittedToCOEAfterScrutiny", "ApprovedLocked"] },
    }).populate("subject setter scrutinyStaff");

    res.json(qps);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch locked QPs" });
  }
};

// ----------------------------------------------------
// SCRUTINY EDITS QP
// ----------------------------------------------------
export const updateQuestionPaperByScrutiny = async (req, res) => {
  try {
    const scrutinyId = await resolveUserId(req);
    const { id } = req.params;
    const { sections } = req.body;

    const qp = await QuestionPaper.findById(id);
    if (!qp) return res.status(404).json({ message: "QP not found" });

    if (
      qp.scrutinyStaff?.toString() !== scrutinyId ||
      qp.status !== "UnderScrutiny"
    ) {
      return res.status(403).json({ message: "Not authorized to edit" });
    }
    if (qp.status !== "UnderScrutiny") {
      return res
        .status(403)
        .json({ message: "Scrutiny editing is not allowed now" });
    }

    qp.sections = sections;
    qp.history.push({ action: "EditedByScrutiny", by: scrutinyId });

    await qp.save();
    res.json(qp);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to update QP",
      error: err.message,
    });
  }
};

// ----------------------------------------------------
// COE APPROVES QP & LOCKS
// ----------------------------------------------------
export const approveQuestionPaper = async (req, res) => {
  try {
    const { id } = req.params;

    const qp = await QuestionPaper.findById(id);
    if (!qp) return res.status(404).json({ message: "QP not found" });

    if (!["UnderScrutiny", "SubmittedToCOE"].includes(qp.status)) {
      return res
        .status(400)
        .json({ message: "Cannot approve in current status" });
    }

    qp.status = "ApprovedLocked";
    qp.history.push({
      action: "ApprovedLocked",
      by: req.userMongoId,
      note: "Final approval",
    });

    await qp.save();
    res.json(qp);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to approve QP",
      error: err.message,
    });
  }
};

// ----------------------------------------------------
// SEND BACK TO SETTER
// ----------------------------------------------------
export const sendBackToSetter = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const qp = await QuestionPaper.findById(id);
    if (!qp) return res.status(404).json({ message: "QP not found" });

    if (!["UnderScrutiny", "SubmittedToCOE"].includes(qp.status)) {
      return res
        .status(400)
        .json({ message: "Cannot send back in current status" });
    }

    qp.status = "CorrectionsRequested";
    qp.history.push({
      action: "CorrectionsRequested",
      by: req.userMongoId,
      note,
    });

    await qp.save();
    res.json(qp);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to send back QP",
      error: err.message,
    });
  }
};

// ----------------------------------------------------
// DOWNLOAD FINAL QP
// ----------------------------------------------------
export const downloadQuestionPaper = async (req, res) => {
  try {
    const { id } = req.params;

    const qp = await QuestionPaper.findById(id).populate("subject");
    if (!qp) return res.status(404).json({ message: "QP not found" });

    if (qp.status !== "ApprovedLocked") {
      return res
        .status(400)
        .json({ message: "Only approved QPs can be downloaded" });
    }

    const filename = `${qp.subject.code}_${qp.examType}_QP.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // TODO: generate pdf
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to download QP",
      error: err.message,
    });
  }
};

export const getAllQuestionPapers = async (req, res) => {
  try {
    const qps = await QuestionPaper.find({})
      .populate("subject")
      .populate("setter", "name department");

    res.json(qps);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to fetch QP list", error: err.message });
  }
};

export const deleteQP = async (req, res) => {
  try {
    await QuestionPaper.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
