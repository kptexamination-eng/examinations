"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

export default function IAEntryPage() {
  const { getToken } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [selectedAllocation, setSelectedAllocation] = useState("");

  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({}); // { studentId: { ia1, ia2, ia3 } }

  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------------
  // 1. Load subjects assigned to staff
  // ---------------------------------------------------------
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const token = await getToken();

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/subject-allocations/staff`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(res);
        const result = Array.isArray(res.data.data) ? res.data.data : res.data;
        console.log(result);
        setSubjects(result);
      } catch (error) {
        console.error("Failed to load subjects:", error);
        setSubjects([]); // fail-safe
      }
    };

    loadSubjects();
  }, []);

  // ---------------------------------------------------------
  // 2. Load students of the selected subject
  // ---------------------------------------------------------
  const loadStudents = async () => {
    if (!selectedAllocation) return;

    setLoading(true);
    try {
      const token = await getToken();
      const allocation = subjects.find((s) => s._id === selectedAllocation);

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students?department=${allocation.department}&semester=${allocation.semester}&section=${allocation.section}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStudents(res.data.data);

      // Initialize marks state
      const initial = {};
      res.data.forEach((s) => {
        initial[s._id] = { ia1: "", ia2: "", ia3: "" };
      });

      setMarks(initial);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Handle marks change
  // ---------------------------------------------------------
  const handleChange = (studentId, field, value) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
  };

  // ---------------------------------------------------------
  // 3. Submit IA to backend (pending approval)
  // ---------------------------------------------------------
  const handleSubmitForApproval = async () => {
    try {
      const token = await getToken();

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ia/pending`,
        {
          subjectAllocationId: selectedAllocation,
          marks, // all student marks
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("IA Marks submitted for HOD approval!");
    } catch (err) {
      console.error(err);
      alert("Submission failed.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Internal Assessment Entry</h1>

      {/* Select Subject */}
      <label className="font-medium">Select Subject</label>
      <select
        value={selectedAllocation}
        onChange={(e) => setSelectedAllocation(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      >
        <option value="">-- Select --</option>
        {subjects.map((s) => (
          <option key={s._id} value={s._id}>
            {s.subject.code} - {s.subject.name} (Sem {s.semester} Sec{" "}
            {s.section})
          </option>
        ))}
      </select>

      <button
        onClick={loadStudents}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        Load Students
      </button>

      {/* Students + IA Entry Table */}
      {loading && <p>Loading students...</p>}

      {students.length > 0 && (
        <div>
          <table className="table-auto border w-full text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2">USN</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">IA1</th>
                <th className="border p-2">IA2</th>
                <th className="border p-2">IA3</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id}>
                  <td className="border p-2">{s.usn}</td>
                  <td className="border p-2">{s.name}</td>
                  <td className="border p-2">
                    <input
                      type="number"
                      className="w-16 border p-1"
                      value={marks[s._id]?.ia1 || ""}
                      onChange={(e) =>
                        handleChange(s._id, "ia1", e.target.value)
                      }
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      className="w-16 border p-1"
                      value={marks[s._id]?.ia2 || ""}
                      onChange={(e) =>
                        handleChange(s._id, "ia2", e.target.value)
                      }
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      className="w-16 border p-1"
                      value={marks[s._id]?.ia3 || ""}
                      onChange={(e) =>
                        handleChange(s._id, "ia3", e.target.value)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Submit Button */}
          <button
            onClick={handleSubmitForApproval}
            className="bg-green-600 text-white px-4 py-2 rounded mt-4"
          >
            Submit for HOD Approval
          </button>
        </div>
      )}
    </div>
  );
}
