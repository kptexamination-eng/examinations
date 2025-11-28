// models/QuestionPaper.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const questionSchema = new Schema({
  qNo: String, // "Q1(a)", "Q2", etc.
  text: String,
  marks: Number,
  bloomsLevel: String, // optional
  choiceGroup: String, // e.g. "SectionA_Group1"
});

const sectionSchema = new Schema({
  label: String, // "Section A"
  instructions: String,
  totalMarks: Number,
  questions: [questionSchema],
});

const questionPaperSchema = new Schema(
  {
    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    department: String, // copy from Subject
    semester: Number, // copy from Subject
    examType: {
      type: String,
      enum: ["IA1", "IA2", "IA3", "SEE"],
      required: true,
    },
    attempt: {
      type: Number,
      default: 1, // in case of repeats / supplementary
    },

    setter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    scrutinyStaff: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: [
        "Assigned", // COE created, setter not started
        "Draft", // setter working
        "SubmittedToCOE", // setter submitted
        "UnderScrutiny", // scrutiny team editing
        "CorrectionsRequested", // scrutiny/COE returned to setter
        "SubmittedToCOEAfterScrutiny",
        "ApprovedLocked", // final approved & locked
      ],
      default: "Assigned",
      index: true,
    },

    sections: {
      type: [sectionSchema],
      default: [],
    },

    history: [
      {
        action: String, // "Created", "SubmittedToCOE", "Approved"
        by: { type: Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

questionPaperSchema.index(
  { subject: 1, examType: 1, attempt: 1, setter: 1 },
  { unique: true }
);

export default model("QuestionPaper", questionPaperSchema);
