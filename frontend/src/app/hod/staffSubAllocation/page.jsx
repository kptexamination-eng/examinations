"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export default function HODSubjectAllocationPage() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const hodDept = user?.publicMetadata?.department;

  const [subjects, setSubjects] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    subjectId: "",
    semester: "",
    section: "A",
    staffList: [
      {
        staffId: "",
        portions: "",
      },
    ],
  });

  // ---------------------------------------------------------
  // Load Subjects & Staff for HOD's Department
  // ---------------------------------------------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await getToken();

        // 1. Load subjects for this dept
        const subjectsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/subjects/getsubjects?department=${hodDept}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // 2. Load staff of HOD dept
        const staffRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/getUsers?department=${hodDept}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setSubjects(subjectsRes.data.data || []);
        setStaff(staffRes.data.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data");
      }
    };

    loadData();
  }, []);

  // ---------------------------------------------------------
  // Add Staff Row
  // ---------------------------------------------------------
  const addStaffRow = () => {
    setForm((prev) => ({
      ...prev,
      staffList: [...prev.staffList, { staffId: "", portions: "" }],
    }));
  };

  // ---------------------------------------------------------
  // Remove Staff Row
  // ---------------------------------------------------------
  const removeStaffRow = (index) => {
    setForm((prev) => ({
      ...prev,
      staffList: prev.staffList.filter((_, i) => i !== index),
    }));
  };

  // ---------------------------------------------------------
  // Submit Allocation
  // ---------------------------------------------------------
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const payload = {
        subjectId: form.subjectId,
        department: hodDept,
        semester: form.semester,
        section: form.section,
        staff: form.staffList.map((s) => ({
          staffId: s.staffId, // sending Clerk ID (backend converts)
          portions: s.portions,
        })),
      };

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subject-allocations`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Subject allocated successfully!");

      setForm({
        subjectId: "",
        semester: "",
        section: "A",
        staffList: [{ staffId: "", portions: "" }],
      });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to assign subject");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Assign Subject to Staff</h1>

      {/* Subject Selection */}
      <label className="font-medium">Select Subject</label>
      <select
        value={form.subjectId}
        onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
        className="border p-2 rounded w-full mb-4"
      >
        <option value="">-- Select Subject --</option>
        {subjects.map((sub) => (
          <option key={sub._id} value={sub._id}>
            {sub.code} - {sub.name}
          </option>
        ))}
      </select>

      {/* Semester */}
      <label className="font-medium">Semester</label>
      <select
        value={form.semester}
        onChange={(e) => setForm({ ...form, semester: e.target.value })}
        className="border p-2 rounded w-full mb-4"
      >
        <option value="">-- Select Semester --</option>
        {[1, 2, 3, 4, 5, 6].map((sem) => (
          <option key={sem} value={sem}>
            Semester {sem}
          </option>
        ))}
      </select>

      {/* Section */}
      <label className="font-medium">Section</label>
      <select
        value={form.section}
        onChange={(e) => setForm({ ...form, section: e.target.value })}
        className="border p-2 rounded w-full mb-4"
      >
        <option value="A">A</option>
        <option value="B">B</option>
      </select>

      {/* Staff Rows */}
      <h2 className="text-lg font-semibold mb-2">Assign Staff</h2>

      {form.staffList.map((staffItem, index) => (
        <div
          key={index}
          className="border p-3 rounded mb-3 bg-gray-50 flex gap-4"
        >
          {/* Staff Dropdown */}
          <div className="flex-1">
            <label className="font-medium">Staff</label>
            <select
              value={staffItem.staffId}
              onChange={(e) => {
                const newList = [...form.staffList];
                newList[index].staffId = e.target.value;
                setForm({ ...form, staffList: newList });
              }}
              className="border p-2 rounded w-full"
            >
              <option value="">-- Select Staff --</option>
              {staff.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.name} ({st.email})
                </option>
              ))}
            </select>
          </div>

          {/* Portions */}
          <div className="flex-1">
            <label className="font-medium">Portions</label>
            <input
              type="text"
              value={staffItem.portions}
              onChange={(e) => {
                const newList = [...form.staffList];
                newList[index].portions = e.target.value;
                setForm({ ...form, staffList: newList });
              }}
              className="border p-2 rounded w-full"
              placeholder="e.g., Units 1–2"
            />
          </div>

          {/* Remove Staff Row */}
          {index > 0 && (
            <button
              onClick={() => removeStaffRow(index)}
              className="bg-red-500 text-white px-3 h-10 rounded mt-7"
            >
              X
            </button>
          )}
        </div>
      ))}

      {/* Add Staff Button */}
      <button
        onClick={addStaffRow}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        + Add Another Staff
      </button>

      {/* Submit */}
      <button
        disabled={loading}
        onClick={handleSubmit}
        className="bg-green-600 text-white px-4 py-2 rounded w-full"
      >
        {loading ? "Saving..." : "Save Allocation"}
      </button>
    </div>
  );
}
