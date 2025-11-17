// src/controllers/userController.js
import cloudinary from "../config/cloudinary.js";
import User from "../models/User.js";
import { clerkClient } from "@clerk/express";
import mongoose from "mongoose";

/**
 * NOTE:
 * - This controller expects req.user to contain at least:
 *    { id: "<clerkId>", role: "<role>" }
 * - The model enums are normalized using the canonical arrays below.
 */

/* ---------- Canonical enums (match models/User.js) ---------- */
const CANONICAL_ROLES = [
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
];

const CANONICAL_DEPARTMENTS = [
  "AT",
  "CH",
  "CE",
  "CS",
  "EC",
  "EEE",
  "ME",
  "PO",
  "SC",
  "EN",
  "OT",
];

/* ---------- Role permission map (uppercase keys for case-insensitive checks) ----------
   This is a sample/hypothesis mapping that mirrors typical hierarchical permissions.
   Adjust entries as needed to match your org rules.
*/
const ROLE_PERMISSIONS = {
  // Admin can manage everything
  ADMIN: CANONICAL_ROLES.map((r) => r.toUpperCase()),

  // Principal can manage most senior academic/admin roles and HOD/Staff/Students
  PRINCIPAL: [
    "HOD",
    "STAFF",
    "MARKENTRYCASEWORKER",
    "STUDENT",
    "OFFICEEXAM",
    "OFFICEADMISSIONS",
    "OFFICEFEE",
  ].map((r) => r.toUpperCase()),

  // Registrar can manage offices and staff/students for admin workflows
  REGISTRAR: [
    "OFFICEADMISSIONS",
    "OFFICEFEE",
    "OFFICEEXAM",
    "STAFF",
    "STUDENT",
  ].map((r) => r.toUpperCase()),

  // COE and AssistantCOE manage exam-related offices and staff
  COE: ["OFFICEEXAM", "STAFF", "MARKENTRYCASEWORKER", "STUDENT"].map((r) =>
    r.toUpperCase()
  ),
  ASSISTANTCOE: ["OFFICEEXAM", "STAFF", "STUDENT"].map((r) => r.toUpperCase()),

  // ChairmanOfExams: exam leadership
  CHAIRMANOFEXAMS: ["COE", "OFFICEEXAM", "STAFF", "STUDENT"].map((r) =>
    r.toUpperCase()
  ),

  // Office roles: can manage students (their domain) and lesser roles
  OFFICEEXAM: ["STUDENT"].map((r) => r.toUpperCase()),
  OFFICEADMISSIONS: ["STUDENT"].map((r) => r.toUpperCase()),
  OFFICEFEE: ["STUDENT"].map((r) => r.toUpperCase()),

  // HOD can manage Staff and Students within department (note: department handling is enforced in controllers)
  HOD: ["STAFF", "STUDENT"].map((r) => r.toUpperCase()),

  // Staff and MarkEntryCaseWorker have no management rights by default
  STAFF: [],
  MARKENTRYCASEWORKER: [],
  STUDENT: [],
};

/* ---------- Helpers ---------- */

/**
 * Normalize an input role (case-insensitive) to canonical role string from CANONICAL_ROLES.
 * Returns null if no match.
 */
const normalizeRole = (roleRaw) => {
  if (!roleRaw) return null;
  const roleUpper = String(roleRaw).trim().toUpperCase();
  const found = CANONICAL_ROLES.find((r) => r.toUpperCase() === roleUpper);
  return found || null;
};

/**
 * Normalize department to canonical department string.
 * Returns null if no match (caller may decide default).
 */
const normalizeDepartment = (deptRaw) => {
  if (!deptRaw) return "";
  const d = String(deptRaw).trim().toUpperCase();
  const found = CANONICAL_DEPARTMENTS.find((x) => x === d);
  return found || "";
};

/**
 * Check if requesterRole can manage targetRole using ROLE_PERMISSIONS
 */
const canManage = (requesterRoleRaw, targetRoleRaw) => {
  const reqUpper = String(requesterRoleRaw || "").toUpperCase();
  const targetUpper = String(targetRoleRaw || "").toUpperCase();

  const allowed = ROLE_PERMISSIONS[reqUpper];
  if (!allowed) return false; // unknown requester role => no rights
  return allowed.includes(targetUpper);
};

/* ---------- Utility to find user by id param (supports Clerk id or Mongo id) ---------- */
const findTargetUser = async (idParam) => {
  if (!idParam) return null;

  if (idParam.startsWith("user_")) {
    return await User.findOne({ clerkId: idParam });
  }

  // if valid ObjectId then try findById
  if (mongoose.Types.ObjectId.isValid(idParam)) {
    return await User.findById(idParam);
  }

  // fallback: maybe clerk id without prefix
  const maybe = await User.findOne({ clerkId: idParam });
  return maybe;
};

/* ---------- Controller methods ---------- */

// CREATE user (Clerk + MongoDB)
export const createUser = async (req, res) => {
  try {
    const requesterRoleRaw = req.user?.role || "";
    const { name, email, phone, department: deptRaw, role: roleRaw } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required.",
      });
    }

    // Normalize role & department to canonical values
    const targetRole = normalizeRole(roleRaw);
    const department = normalizeDepartment(deptRaw);

    if (!targetRole) {
      return res.status(400).json({
        success: false,
        message: `Role is required and must be one of: ${CANONICAL_ROLES.join(
          ", "
        )}`,
      });
    }

    if (!canManage(requesterRoleRaw, targetRole)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to create this type of user.",
      });
    }

    // Create Clerk user
    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [email],
      firstName: name,
      publicMetadata: {
        role: targetRole,
        department: department || null,
      },
    });

    // Mirror into MongoDB (use clerkUser.id as clerkId)
    const user = new User({
      name: name.trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone || "",
      department: department || "",
      role: targetRole,
      clerkId: clerkUser.id,
      imageUrl: req.cloudinaryResult?.secure_url,
      imagePublicId: req.cloudinaryResult?.public_id,
      isActive: true,
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (err) {
    console.error("CreateUser Error:", err);

    // Clerk error structure
    if (err.clerkError && err.errors) {
      return res.status(err.status || 400).json({
        success: false,
        message: err.errors[0]?.message || "Failed to create user.",
        errors: err.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// READ all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    console.error("GetUsers Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// READ one user by ID (Mongo _id or ClerkId)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await findTargetUser(id);

    if (!user) {
      // fallback for admin-only Clerk users or missing mongo doc
      return res.json({
        success: true,
        data: {
          name: "Admin",
          email: req.auth?.claims?.email || "admin@system.com",
          phone: req.auth?.claims?.phone || "N/A",
          imageUrl: "/default-avatar.png",
          role: "Admin",
          department: "",
        },
      });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    console.error("GetUserById Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE user
export const updateUser = async (req, res) => {
  try {
    const clerkRoleRaw = req.user?.role;
    const requesterClerkId = req.user?.id;
    const { id } = req.params;

    const targetUser = await findTargetUser(id);
    if (!targetUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // If requester is not the same user, check permissions
    if (targetUser.clerkId !== requesterClerkId) {
      if (!canManage(clerkRoleRaw, targetUser.role)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this user.",
        });
      }
    }

    // Prepare updateData
    const updateData = { ...req.body };

    // Validate & normalize role if provided
    if (updateData.role) {
      const normalizedRole = normalizeRole(updateData.role);
      if (!normalizedRole) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Must be one of: ${CANONICAL_ROLES.join(
            ", "
          )}`,
        });
      }
      updateData.role = normalizedRole;
    }

    // Normalize department if provided
    if (updateData.department !== undefined) {
      updateData.department = normalizeDepartment(updateData.department);
    }

    // Handle Cloudinary upload result (if present)
    if (req.cloudinaryResult) {
      updateData.imageUrl = req.cloudinaryResult.secure_url;
      updateData.imagePublicId = req.cloudinaryResult.public_id;
    }

    // Update Clerk publicMetadata (if user has a clerkId)
    if (targetUser.clerkId) {
      try {
        await clerkClient.users.updateUser(targetUser.clerkId, {
          publicMetadata: {
            role: updateData.role || targetUser.role,
            department:
              updateData.department !== undefined
                ? updateData.department || null
                : targetUser.department || null,
          },
        });
      } catch (err) {
        console.error("Clerk update error (non-fatal):", err);
        // continue - we still try to update Mongo record
      }
    }

    // Update Mongo
    const user = await User.findByIdAndUpdate(targetUser._id, updateData, {
      new: true,
    });

    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (err) {
    console.error("UpdateUser Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE user
export const deleteUser = async (req, res) => {
  try {
    const clerkRoleRaw = req.user?.role;
    const requesterClerkId = req.user?.id;
    const { id } = req.params;

    const user = await findTargetUser(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Prevent self-delete (by clerkId)
    if (user.clerkId && user.clerkId === requesterClerkId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account.",
      });
    }

    if (!canManage(clerkRoleRaw, user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this user.",
      });
    }

    // Delete Cloudinary image first (optional)
    if (user.imagePublicId) {
      try {
        const result = await cloudinary.uploader.destroy(user.imagePublicId);
        console.log("Cloudinary deletion result:", result);
      } catch (err) {
        console.error("Cloudinary deletion error:", err);
        // continue deletion even if Cloudinary fails
      }
    }

    // Delete Clerk user (if present) - non-fatal
    if (user.clerkId) {
      try {
        await clerkClient.users.deleteUser(user.clerkId);
      } catch (err) {
        console.error("Clerk deletion error (non-fatal):", err);
        // continue to delete Mongo record
      }
    }

    // Delete MongoDB record
    await user.deleteOne();

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("DeleteUser Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// SYNC user (Clerk → MongoDB if missing)
export const syncUser = async (req, res) => {
  try {
    const clerkId = req.user?.id;
    if (!clerkId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing clerk id" });
    }

    let user = await User.findOne({ clerkId });

    if (!user) {
      // fetch clerk user
      const clerkUser = await clerkClient.users.getUser(clerkId);

      // Normalize role & department found in Clerk publicMetadata
      const normalizedRole = normalizeRole(
        clerkUser.publicMetadata?.role || clerkUser.public_metadata?.role
      );
      const normalizedDept = normalizeDepartment(
        clerkUser.publicMetadata?.department ||
          clerkUser.public_metadata?.department
      );

      user = new User({
        name: clerkUser.firstName || "Unknown",
        email:
          clerkUser.emailAddresses?.[0]?.emailAddress ||
          clerkUser.primaryEmailAddress?.emailAddress ||
          "unknown@example.com",
        phone:
          clerkUser.phoneNumbers?.[0]?.phoneNumber ||
          clerkUser.primaryPhoneNumber?.phoneNumber ||
          "N/A",
        role: normalizedRole || "Student",
        department: normalizedDept || "",
        clerkId: clerkUser.id,
        imageUrl: clerkUser.profileImageUrl || "/default-avatar.png",
        isActive: true,
      });

      await user.save();
      console.log(`✅ Synced new user: ${user.email}`);
    }

    return res.json({ success: true, data: user });
  } catch (err) {
    console.error("SyncUser Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
