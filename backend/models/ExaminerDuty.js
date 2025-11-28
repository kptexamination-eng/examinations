// // models/ExaminerDuty.js
// import mongoose from "mongoose";

// const { Schema, model } = mongoose;

// const examinerDutySchema = new Schema(
//   {
//     staff: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },
//     subject: {
//       type: Schema.Types.ObjectId,
//       ref: "Subject",
//       required: true,
//     },
//     department: {
//       type: String,
//       required: true, // copy from Subject.department for easy filtering
//     },
//     semester: {
//       type: Number,
//       required: true, // copy from Subject.semester
//     },
//     examDate: Date,
//     batch: String, // e.g. "Batch 1", "A1", etc.
//     internalOrExternal: {
//       type: String,
//       enum: ["Internal", "External"],
//       default: "External",
//     },
//     status: {
//       type: String,
//       enum: ["Assigned", "MarksEntryOpen", "Submitted", "Locked"],
//       default: "Assigned",
//       index: true,
//     },
//     // future: center code, session, etc.
//   },
//   { timestamps: true }
// );

// // prevent same staff getting duplicate duties on same subject & batch
// examinerDutySchema.index({ staff: 1, subject: 1, batch: 1 }, { unique: true });

// export default model("ExaminerDuty", examinerDutySchema);
