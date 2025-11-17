"use client";

import React, { useState } from "react";
import axios from "axios";
import { Upload, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import HODTable from "./HODTable";
import LoaderOverlay from "../../components/LoaderOverlay";

const departments = [
  { value: "", label: "All Departments" },
  { value: "AT", label: "Automobile Engineering" },
  { value: "CH", label: "Chemical Engineering" },
  { value: "CE", label: "Civil Engineering" },
  { value: "CS", label: "Computer Science Engineering" },
  { value: "EC", label: "Electronics & Communication Engineering" },
  { value: "EEE", label: "Electrical & Electronics Engineering" },
  { value: "ME", label: "Mechanical Engineering" },
  { value: "PO", label: "Polymer Engineering" },
  { value: "SC", label: "Science and English" },
];

const roles = [
  "HOD",
  "Admin",
  "Principal",
  "Registrar",
  "COE",
  "AssistantCOE",
  "ChairmanOfExams",
  "Staff",
  "Student",
];

export default function AddHODForm() {
  const { getToken } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    role: "HOD",
    image: null,
  });

  const [status, setStatus] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files) {
      setForm({ ...form, image: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("saving");

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      const token = await getToken();

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/adduser`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(`${form.role} added successfully!`);

      setForm({
        name: "",
        email: "",
        phone: "",
        department: "",
        role: "HOD",
        image: null,
      });

      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to add member.";
      toast.error(message);
    } finally {
      setStatus(null);
    }
  };

  return (
    <section className="relative">
      {status === "saving" && (
        <LoaderOverlay message={`Adding ${form.role}...`} />
      )}

      {/* Header */}
      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        Add Head of Department
      </h2>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-2xl p-8 space-y-6 border border-gray-100"
      >
        {/* Name */}
        <div>
          <label className="text-sm font-semibold text-gray-700">
            Full Name
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="mt-2 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Enter full name"
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-sm font-semibold text-gray-700">Email</label>
          <input
            name="email"
            value={form.email}
            type="email"
            onChange={handleChange}
            required
            className="mt-2 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Enter email"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="text-sm font-semibold text-gray-700">Phone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            className="mt-2 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Enter phone number"
          />
        </div>

        {/* Department */}
        <div>
          <label className="text-sm font-semibold text-gray-700">
            Department
          </label>
          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            required
            className="mt-2 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.value} value={dept.value}>
                {dept.label}
              </option>
            ))}
          </select>
        </div>

        {/* Role */}
        <div>
          <label className="text-sm font-semibold text-gray-700">Role</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="mt-2 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Image Upload */}
        <div>
          <label className="text-sm font-semibold text-gray-700">
            Profile Image
          </label>

          <div className="flex items-center gap-5 mt-2">
            {form.image ? (
              <img
                src={URL.createObjectURL(form.image)}
                className="w-20 h-20 rounded-full border object-cover shadow-md"
              />
            ) : (
              <div className="w-20 h-20 flex items-center justify-center rounded-full bg-gray-100 border shadow-inner">
                <ImageIcon className="w-7 h-7 text-gray-400" />
              </div>
            )}

            <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 shadow">
              <Upload className="w-5 h-5" />
              Upload Image
              <input
                type="file"
                name="image"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
              />
            </label>
          </div>
        </div>

        {/* Button */}
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all"
        >
          Add Member
        </button>
      </form>

      {/* Refresh Table */}
      <HODTable key={refreshKey} />
    </section>
  );
}
