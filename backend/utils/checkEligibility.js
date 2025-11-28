// utils/checkEligibility.js
import Attendance from "../models/Attendance.js";
import IA from "../models/InternalMarks.js";
import FeePayment from "../models/Fee.js";

/**
 * Check if a student is eligible to sit exam for the given subjectAllocation ids (or semester)
 * Returns { eligible: boolean, reasons: [string], details: { attendance, ia, fee } }
 *
 * Configurable thresholds are defined here.
 */
export const MIN_ATTENDANCE_PERCENT = 75;
export const MIN_IA_PERCENT = 40;

export async function checkStudentEligibility({
  studentId,
  subjectAllocationIds = [],
  examType,
}) {
  const reasons = [];
  const details = { attendance: [], ia: [], fee: null };

  // 1) Fee: student must have a fee payment record for the examType
  const fee = await FeePayment.findOne({ studentId, examType });
  details.fee = !!fee;
  if (!fee) reasons.push("Exam fee not paid");

  // 2) Attendance: ensure each subjectAllocation has attendance >= MIN_ATTENDANCE_PERCENT
  for (const saId of subjectAllocationIds) {
    const att = await Attendance.findOne({
      studentId,
      subjectAllocation: saId,
    }).lean();
    if (!att) {
      reasons.push(`No attendance record for subject allocation ${saId}`);
      details.attendance.push({
        subjectAllocation: saId,
        isEligible: false,
        percentage: null,
      });
      continue;
    }
    details.attendance.push({
      subjectAllocation: saId,
      isEligible: !!att.isEligible,
      percentage: att.percentage,
    });
    if (
      !att.isEligible ||
      (typeof att.percentage === "number" &&
        att.percentage < MIN_ATTENDANCE_PERCENT)
    ) {
      reasons.push(
        `Attendance below ${MIN_ATTENDANCE_PERCENT}% for subject allocation ${saId}`
      );
    }
  }

  // 3) IA: ensure IA >= MIN_IA_PERCENT (interpreted as percent of maxMarks if available)
  for (const saId of subjectAllocationIds) {
    const ia = await IA.findOne({ studentId, subjectAllocation: saId }).lean();
    if (!ia) {
      reasons.push(`No IA record for subject allocation ${saId}`);
      details.ia.push({
        subjectAllocation: saId,
        isEligible: false,
        finalIA: null,
        maxMarks: null,
      });
      continue;
    }
    details.ia.push({
      subjectAllocation: saId,
      isEligible: !!ia.isEligible,
      finalIA: ia.finalIA,
      maxMarks: ia.maxMarks,
    });
    if (typeof ia.finalIA === "number" && typeof ia.maxMarks === "number") {
      const percent = (ia.finalIA / ia.maxMarks) * 100;
      if (percent < MIN_IA_PERCENT) {
        reasons.push(
          `IA below ${MIN_IA_PERCENT}% for subject allocation ${saId}`
        );
      }
    } else if (!ia.isEligible) {
      reasons.push(`Marked ineligible in IA for subject allocation ${saId}`);
    }
  }

  const eligible = reasons.length === 0;
  return { eligible, reasons, details };
}
