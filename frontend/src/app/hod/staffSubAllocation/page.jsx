"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export default function HODSubjectAllocationPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const hodDept = user?.publicMetadata?.department;

  const [allSubjects, setAllSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    semester: "",
    subjectId: "",
    staffId: "",
  });

  // ---------------------------------------------------------
  // Load subjects & staff
  // ---------------------------------------------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await getToken();

        // All subjects of dept
        const subjectsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/subjects/getsubjects?department=${hodDept}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setAllSubjects(subjectsRes.data.data || []);
        // 2. Load staff of HOD dept
        const staffRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/getUsers?department=${hodDept}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Filter only staff role
        const staffOnly = (staffRes.data.data || []).filter(
          (u) => u.role === "Staff"
        );

        setStaff(staffOnly);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data");
      }
    };

    loadData();
  }, []);

  // ---------------------------------------------------------
  // Filter subjects based on selected semester
  // ---------------------------------------------------------
  useEffect(() => {
    if (form.semester) {
      const filtered = allSubjects.filter(
        (sub) => Number(sub.semester) === Number(form.semester)
      );
      setFilteredSubjects(filtered);
    } else {
      setFilteredSubjects([]);
    }
  }, [form.semester, allSubjects]);

  // ---------------------------------------------------------
  // Submit allocation
  // ---------------------------------------------------------
  const handleSubmit = async () => {
    if (!form.semester || !form.subjectId || !form.staffId) {
      return toast.error("Please fill all fields");
    }

    try {
      setLoading(true);
      const token = await getToken();

      const payload = {
        subjectId: form.subjectId,
        department: hodDept,
        semester: Number(form.semester),

        section: "A", // FIXED
        staff: [
          {
            staffId: form.staffId,
            portions: "FULL", // FIXED value
          },
        ],
      };
      console.log("Payload being sent:", payload);

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subject-allocations`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Subject allocated successfully!");

      setForm({
        semester: "",
        subjectId: "",
        staffId: "",
      });
      setFilteredSubjects([]);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to assign subject");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Assign Subject to Staff</h1>

      {/* Semester */}
      <label className="font-medium">Select Semester</label>
      <select
        value={form.semester}
        onChange={(e) =>
          setForm({ ...form, semester: e.target.value, subjectId: "" })
        }
        className="border p-2 rounded w-full mb-4"
      >
        <option value="">-- Select Semester --</option>
        {[1, 2, 3, 4, 5, 6].map((sem) => (
          <option key={sem} value={sem}>
            Semester {sem}
          </option>
        ))}
      </select>

      {/* Subject List (Filtered by Semester) */}
      <label className="font-medium">Select Subject</label>
      <select
        value={form.subjectId}
        onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
        className="border p-2 rounded w-full mb-4"
        disabled={!form.semester}
      >
        <option value="">
          {form.semester ? "-- Select Subject --" : "Select semester first"}
        </option>
        {filteredSubjects.map((sub) => (
          <option key={sub._id} value={sub._id}>
            {sub.code} - {sub.name}
          </option>
        ))}
      </select>

      {/* Staff */}
      <label className="font-medium">Select Staff</label>
      <select
        value={form.staffId}
        onChange={(e) => setForm({ ...form, staffId: e.target.value })}
        className="border p-2 rounded w-full mb-4"
      >
        <option value="">-- Select Staff --</option>
        {staff.map((st) => (
          <option key={st._id} value={st._id}>
            {st.name} ({st.email})
          </option>
        ))}
      </select>

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
