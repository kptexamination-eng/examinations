import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    clerkId: { type: String, index: true, sparse: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    name: { type: String, required: true, trim: true },

    role: {
      type: String,
      enum: [
        "Admin",
        "Principal",
        "Registrar",
        "COE",
        "AssistantCOE",
        "ChairmanOfExams",
        "OfficeExam",
        "OfficeAdmissions",
        "OfficeFee",
        "HOD",
        "Staff",
        "MarkEntryCaseWorker",
        "Student",
      ],
      default: "Student",
    },

    department: {
      type: String,
      enum: ["AT", "CH", "CE", "CS", "EC", "EEE", "ME", "PO", "SC", "EN", "OT"],
      default: "",
    },

    imageUrl: String,
    imagePublicId: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ⬇ DEFINE MODEL FIRST
const User = model("User", userSchema);

// ⬇ THEN DEFINE UTILITY USING THE MODEL
export const resolveUserId = async (req, explicitMongoId = null) => {
  // Case 1: caller passes a Mongo _id (24 chars)
  if (explicitMongoId && explicitMongoId.length === 24) {
    return explicitMongoId;
  }

  // Case 2: logged-in staff via Clerk
  if (req.user?.clerkId) {
    const u = await User.findOne({ clerkId: req.user.clerkId, isActive: true });
    if (!u) {
      throw new Error("No local User found for this Clerk account");
    }
    return u._id.toString();
  }

  throw new Error("Unable to resolve user id (no mongoId or Clerk id)");
};

export default User;
