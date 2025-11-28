// controllers/hallTicketController.js
import PDFDocument from "pdfkit";
import axios from "axios";
import moment from "moment";

import Student from "../models/Student.js";
import Subject from "../models/Subject.js";
import SubjectAllocation from "../models/SubjectAllocation.js"; // you referenced this in other schemas
import IA from "../models/InternalMarks.js";
import Attendance from "../models/Attendance.js";
import { checkStudentEligibility } from "../utils/checkEligibility.js";
import FeePayment from "../models/Fee.js";

/**
 * GET /api/halltickets/:studentId/print?examType=NOV2025
 * - requires HOD authorization middleware
 */
export const printHallTicket = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { examType } = req.query; // e.g. "NOV2025" or "C20"

    const student = await Student.findById(studentId).lean();
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Fetch subject allocations for the student's current department & semester
    // (This assumes your SubjectAllocation model has fields: department, semester, subject (ref Subject))
    const allocations = await SubjectAllocation.find({
      department: student.currentDepartment,
      semester: Number(student.semester),
    })
      .populate("subject")
      .lean();

    // collect allocation IDs
    const allocationIds = allocations.map((a) => a._id);

    // Check eligibility (fee + attendance + IA)
    const eligibility = await checkStudentEligibility({
      studentId,
      subjectAllocationIds: allocationIds,
      examType,
    });

    // If not eligible, we still generate hall ticket but mark "NOT ELIGIBLE" and include reasons.
    // (If you prefer blocking generation entirely, return 403 here.)
    // Prepare subject rows with IA/attendance status
    const rows = [];
    for (const alloc of allocations) {
      const iaRec = await IA.findOne({
        studentId,
        subjectAllocation: alloc._id,
      }).lean();
      const attRec = await Attendance.findOne({
        studentId,
        subjectAllocation: alloc._id,
      }).lean();

      const iaDisplay = iaRec
        ? `${iaRec.finalIA ?? "-"} / ${iaRec.maxMarks ?? "-"}`
        : "-";
      const attDisplay = attRec
        ? `${attRec.percentage?.toFixed(2) ?? "-"}% (${
            attRec.presentHours ?? 0
          }/${attRec.totalHours ?? 0})`
        : "-";

      rows.push({
        code: alloc.subject.code,
        name: alloc.subject.name,
        ia: iaDisplay,
        attendance: attDisplay,
      });
    }

    // Start PDF
    const doc = new PDFDocument({ size: "A4", margin: 36 });
    res.setHeader("Content-Type", "application/pdf");
    // inline for printing; change to attachment to force download
    res.setHeader(
      "Content-Disposition",
      `inline; filename="hallticket_${
        student.registerNumber || student._id
      }.pdf"`
    );

    doc.pipe(res);

    // Header area: institute, title
    doc.fontSize(14).text("GOVERNMENT OF KARNATAKA", { align: "center" });
    doc
      .fontSize(12)
      .text("BOARD OF TECHNICAL EXAMINATION, PALACE ROAD, BANGALORE", {
        align: "center",
      });
    doc.moveDown(0.3);
    doc
      .fontSize(18)
      .text("ADMISSION TICKET", { align: "center", underline: true });
    doc.moveDown(0.5);

    // layout: left student details, right photo
    const startY = doc.y;
    const leftX = doc.page.margins.left;
    const photoX = 420;
    const photoSize = 95;

    doc.fontSize(10);
    doc.text(`Institute: ${student.instituteName || " - "}`, leftX, startY);
    doc.text(`Course: ${student.currentDepartment || "-"}`, leftX);
    doc.text(`Register No.: ${student.registerNumber || " - "}`, leftX);
    doc.text(`Name of Student: ${student.name}`, leftX);
    doc.text(`Father's Name: ${student.fatherName}`, leftX);
    doc.text(`Semester: ${student.semester}`, leftX);
    doc.text(`Batch: ${student.batch}`, leftX);
    doc.moveDown(0.2);

    // Photo (download and draw)
    if (student.imageUrl) {
      try {
        const resp = await axios.get(student.imageUrl, {
          responseType: "arraybuffer",
        });
        const imageBuffer = Buffer.from(resp.data, "binary");
        doc.image(imageBuffer, photoX, startY, {
          fit: [photoSize, photoSize],
          align: "right",
        });
      } catch (err) {
        // ignore photo errors and continue
        console.warn("Failed to fetch student photo:", err.message);
      }
    }

    doc.moveDown(2);

    // Subjects table header
    doc.fontSize(11).text("Subjects", { underline: true });
    doc.moveDown(0.2);

    // Table column positions
    const tableTop = doc.y + 4;
    const colCode = leftX;
    const colName = colCode + 70;
    const colIA = colName + 260;
    const colAtt = colIA + 90;

    // Table header
    doc.font("Helvetica-Bold");
    doc.fontSize(10);
    doc.text("QP Code", colCode, tableTop);
    doc.text("Subject Name", colName, tableTop);
    doc.text("IA (Marks)", colIA, tableTop, { width: 80, align: "left" });
    doc.text("Attendance", colAtt, tableTop, { width: 120, align: "left" });

    doc.moveDown(0.6);
    doc.font("Helvetica");
    // Table rows
    let y = doc.y;
    rows.forEach((r) => {
      doc.text(r.code, colCode, y);
      doc.text(r.name, colName, y, { width: 250 });
      doc.text(r.ia, colIA, y, { width: 80 });
      doc.text(r.attendance, colAtt, y, { width: 120 });
      y = y + 16;
      if (y > doc.page.height - 120) {
        doc.addPage();
        y = doc.y;
      }
    });

    doc
      .moveTo(leftX, y + 6)
      .lineTo(doc.page.width - doc.page.margins.right, y + 6)
      .stroke();

    // Eligibility block
    doc.moveDown(1);
    doc.fontSize(10).font("Helvetica-Bold").text("Eligibility Status:");
    doc.font("Helvetica").fontSize(10);
    if (eligibility.eligible) {
      doc
        .fillColor("green")
        .text("ELIGIBLE TO APPEAR FOR THE EXAM", { continued: false });
      doc.fillColor("black");
    } else {
      doc.fillColor("red").text("NOT ELIGIBLE", { continued: false });
      doc.fillColor("black");
      doc.moveDown(0.2);
      doc.fontSize(9);
      doc.text("Reasons:", { continued: false });
      eligibility.reasons.forEach((r) => doc.text(`• ${r}`));
    }

    doc.moveDown(1);
    // Footer with exam info and signatures
    const printedOn = moment().format("DD-MM-YYYY HH:mm");
    doc.fontSize(9).text(`Exam: ${examType || "-"}`, leftX);
    doc.text(`Printed On: ${printedOn}`, leftX);

    // Signatures placeholders
    const sigY = doc.y + 30;
    doc.text("Signature of Student", leftX, sigY);
    doc.text("HOD", leftX + 200, sigY);
    doc.text("Principal/Chief Suptd.", leftX + 380, sigY);

    // finalise
    doc.end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server error generating hall ticket",
      error: err.message,
    });
  }
};
