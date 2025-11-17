"use client";

import React, { useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Upload, Image as ImageIcon } from "lucide-react";
import LoaderOverlay from "../../components/LoaderOverlay";
import BulkUpload from "./bulkupload/BulkUpload";

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

const semesters = Array.from({ length: 6 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `${i + 1}`,
}));

const batches = [
  { value: "B1", label: "B1" },
  { value: "B2", label: "B2" },
  { value: "B3", label: "B3" },
  { value: "B4", label: "B4" },
];

const categories = [
  { value: "GM", label: "GM (General Merit)" },
  { value: "SC", label: "SC (Scheduled Caste)" },
  { value: "ST", label: "ST (Scheduled Tribe)" },
  { value: "C1", label: "Category 1" },
  { value: "2A", label: "Category 2A" },
  { value: "2B", label: "Category 2B" },
  { value: "3A", label: "Category 3A" },
  { value: "3B", label: "Category 3B" },
];

export default function StudentForm() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const role = user?.publicMetadata?.role;
  const hodDepartment = user?.publicMetadata?.department;
  const isScienceHOD = role === "HOD" && hodDepartment === "sc";

  const [form, setForm] = useState({
    registerNumber: "",
    name: "",
    fatherName: "",
    gender: "",
    category: "",
    email: "",
    phone: "",
    department: hodDepartment || "",
    semester: "",
    batch: "",
    role: "Student",
    image: null,
  });

  const [status, setStatus] = useState(null);

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

    if (isScienceHOD) {
      toast.error("❌ Science HOD cannot add students.");
      return;
    }

    setStatus("saving");

    try {
      const transformedForm = Object.fromEntries(
        Object.entries(form).map(([key, value]) => {
          if (typeof value === "string" && key !== "email") {
            return [key, value.toUpperCase()];
          }
          return [key, value];
        })
      );

      const formData = new FormData();
      Object.entries(transformedForm).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      // HOD cannot change department
      if (role === "HOD") {
        formData.set("department", hodDepartment);
      }

      const token = await getToken();
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/addstudent`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("✅ Student added successfully!");

      setForm({
        registerNumber: "",
        name: "",
        fatherName: "",
        gender: "",
        category: "",
        email: "",
        phone: "",
        department: hodDepartment || "",
        semester: "",
        batch: "",
        role: "Student",
        image: null,
      });
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || "❌ Failed to add student";
      toast.error(message);
    } finally {
      setStatus(null);
    }
  };

  return (
    <section className="relative">
      {status === "saving" && <LoaderOverlay message="Adding student..." />}

      <h2 className="text-2xl font-semibold mb-4">Add Student</h2>

      {isScienceHOD ? (
        <p className="text-red-600 font-medium mb-4">
          ⚠️ Science & English HOD cannot add students.
        </p>
      ) : (
        <>
          <BulkUpload />

          <form
            onSubmit={handleSubmit}
            className="space-y-4 bg-white p-6 mt-14 rounded-lg shadow"
          >
            <h3 className="text-2xl font-semibold mb-4 text-blue-600">
              Add Individual Student
            </h3>

            <input
              name="registerNumber"
              value={form.registerNumber}
              onChange={handleChange}
              placeholder="Register Number"
              required
              className="block w-full rounded-md border px-3 py-2"
            />

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
              className="block w-full rounded-md border px-3 py-2"
            />

            <input
              name="fatherName"
              value={form.fatherName}
              onChange={handleChange}
              placeholder="Father's Name"
              required
              className="block w-full rounded-md border px-3 py-2"
            />

            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              required
              className="block w-full rounded-md border px-3 py-2"
            >
              <option value="">Select Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>

            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="block w-full rounded-md border px-3 py-2"
            >
              <option value="">Select Category (Optional)</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              required
              className="block w-full rounded-md border px-3 py-2"
            />

            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              required
              className="block w-full rounded-md border px-3 py-2"
            />

            {/* Department */}
            {role === "HOD" ? (
              <input
                value={
                  departments.find((d) => d.value === hodDepartment)?.label ||
                  hodDepartment
                }
                disabled
                className="block w-full rounded-md border px-3 py-2 bg-gray-100"
              />
            ) : (
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                required
                className="block w-full rounded-md border px-3 py-2"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>
            )}

            {/* Semester */}
            <select
              name="semester"
              value={form.semester}
              onChange={handleChange}
              required
              className="block w-full rounded-md border px-3 py-2"
            >
              <option value="">Select Semester</option>
              {semesters.map((sem) => (
                <option key={sem.value} value={sem.value}>
                  {sem.label}
                </option>
              ))}
            </select>

            {/* Batch */}
            <select
              name="batch"
              value={form.batch}
              onChange={handleChange}
              required
              className="block w-full rounded-md border px-3 py-2"
            >
              <option value="">Select Batch</option>
              {batches.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>

            {/* Image */}
            <div className="flex items-center gap-4">
              {form.image ? (
                <img
                  src={URL.createObjectURL(form.image)}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover border"
                />
              ) : (
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 border">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}

              <label className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border cursor-pointer hover:bg-blue-100 transition">
                <Upload className="w-5 h-5 inline-block mr-2" />
                Upload
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleChange}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Add Student
            </button>
          </form>
        </>
      )}
    </section>
  );
}
