const attendanceSchema = new mongoose.Schema({
  subjectAllocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubjectAllocation",
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: Date,
  present: Boolean,
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});
