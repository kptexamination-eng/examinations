"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

export default function IAEntryPage() {
  const { getToken } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [selectedAllocation, setSelectedAllocation] = useState("");

  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({}); // { studentId: finalIA }

  const [maxMarks, setMaxMarks] = useState(null);
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------------
  // Load subjects handled by staff
  // ---------------------------------------------------------
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const token = await getToken();

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/subject-allocations/staff`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const result = Array.isArray(res.data.data) ? res.data.data : res.data;

        setSubjects(result);
      } catch (error) {
        console.error("Failed to load subjects:", error);
        setSubjects([]);
      }
    };

    loadSubjects();
  }, []);

  // ---------------------------------------------------------
  // Load students for selected subject
  // ---------------------------------------------------------
  const loadStudents = async () => {
    setLoading(true);

    try {
      const token = await getToken();
      const allocation = subjects.find((s) => s._id === selectedAllocation);

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/getstudents?department=${allocation.department}&semester=${allocation.semester}&section=${allocation.section}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const list = Array.isArray(res.data?.data) ? res.data.data : [];

      // Filter valid students (must have ObjectId)
      const validStudents = list.filter((stu) => stu && stu._id);

      setStudents(validStudents);

      // Build marks object cleanly
      const m = {};
      validStudents.forEach((stu) => {
        m[String(stu._id)] = "";
      });

      setMarks(m);
    } catch (err) {
      console.error("Error loading students:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Handle IA value change
  // ---------------------------------------------------------
  const handleMarkChange = (studentId, value) => {
    // Prevent negative and > max
    if (value < 0) value = 0;
    if (maxMarks && value > maxMarks) value = maxMarks;

    setMarks((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  };

  // ---------------------------------------------------------
  // Submit all IA marks to Pending IA table
  // ---------------------------------------------------------
  const submitIA = async () => {
    try {
      const token = await getToken();

      // Validate all fields
      for (const [sid, ia] of Object.entries(marks)) {
        if (ia === "" || ia === null || ia === undefined) {
          alert("Please fill all IA marks before submitting.");
          return;
        }
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ia/pending`,
        {
          subjectAllocationId: selectedAllocation,
          marks,
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
      <label className="font-semibold">Select Subject</label>
      <select
        className="border p-2 rounded w-full mb-4"
        value={selectedAllocation}
        onChange={(e) => setSelectedAllocation(e.target.value)}
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

      {loading && <p>Loading students...</p>}

      {/* IA Max Marks */}
      {maxMarks !== null && (
        <p className="mb-4 font-semibold">
          IA Maximum Marks: <span className="text-blue-600">{maxMarks}</span>
        </p>
      )}

      {/* Student Table */}
      {students.length > 0 && (
        <div>
          <table className="w-full border text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2">USN</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Final IA</th>
              </tr>
            </thead>
            <tbody>
              {students.map((stu) => (
                <tr key={stu._id}>
                  <td className="border p-2">{stu.registerNumber}</td>
                  <td className="border p-2">{stu.name}</td>
                  <td className="border p-2">
                    <input
                      type="number"
                      className="w-24 border p-1 rounded"
                      min="0"
                      max={maxMarks}
                      value={marks[stu._id]}
                      onChange={(e) =>
                        handleMarkChange(stu._id, Number(e.target.value))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={submitIA}
            className="bg-green-600 text-white px-4 py-2 rounded mt-4"
          >
            Submit for HOD Approval
          </button>
        </div>
      )}
    </div>
  );
}
