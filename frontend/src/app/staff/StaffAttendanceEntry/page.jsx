"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

export default function StaffAttendanceEntry() {
  const { getToken } = useAuth();

  const [allocations, setAllocations] = useState([]);
  const [selectedAlloc, setSelectedAlloc] = useState("");

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { studentId: { present, total } }

  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------------
  // Load allocations handled by staff (same as IA working code)
  // ---------------------------------------------------------
  useEffect(() => {
    const loadAllocations = async () => {
      try {
        const token = await getToken();

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/subject-allocations/staff`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const result = Array.isArray(res.data.data) ? res.data.data : res.data;

        setAllocations(result);
      } catch (err) {
        console.error("Failed to load allocations:", err);
      }
    };

    loadAllocations();
  }, []);

  // ---------------------------------------------------------
  // Load students based on allocation (JUST LIKE IA WORKING CODE)
  // ---------------------------------------------------------
  const loadStudents = async () => {
    setLoading(true);
    try {
      const token = await getToken();

      const allocation = allocations.find((s) => s._id === selectedAlloc);

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/getstudents?department=${allocation.department}&semester=${allocation.semester}&section=${allocation.section}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const list = Array.isArray(res.data?.data) ? res.data.data : [];

      const validStudents = list.filter((stu) => stu && stu._id);

      setStudents(validStudents);

      // Build attendance object
      const att = {};
      validStudents.forEach((stu) => {
        att[String(stu._id)] = { present: "", total: "" };
      });

      setAttendance(att);
    } catch (err) {
      console.error("Error loading students:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Submit attendance to backend
  // ---------------------------------------------------------
  const submitAttendance = async () => {
    try {
      const token = await getToken();

      // Validate all values
      for (const [sid, val] of Object.entries(attendance)) {
        if (!val.present || !val.total) {
          alert("Please fill all attendance values.");
          return;
        }
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/submit`,
        {
          subjectAllocationId: selectedAlloc,
          attendance,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Attendance submitted for HOD approval");
    } catch (err) {
      console.error(err);
      alert("Submission failed.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Attendance Entry</h1>

      {/* Select Subject */}
      <label className="font-semibold">Select Subject</label>
      <select
        className="border p-2 rounded w-full mb-4"
        value={selectedAlloc}
        onChange={(e) => setSelectedAlloc(e.target.value)}
      >
        <option value="">-- Select --</option>
        {allocations.map((a) => (
          <option key={a._id} value={a._id}>
            {a.subject.code} - {a.subject.name}
          </option>
        ))}
      </select>

      <button
        onClick={loadStudents}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        Load Students
      </button>

      {loading && <p>Loading...</p>}

      {/* Students Table */}
      {students.length > 0 && (
        <>
          <table className="w-full border text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2">USN</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Present</th>
                <th className="border p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id}>
                  <td className="border p-2">{s.registerNumber}</td>
                  <td className="border p-2">{s.name}</td>

                  <td className="border p-2">
                    <input
                      type="number"
                      className="w-20 p-1 border rounded"
                      value={attendance[s._id]?.present || ""}
                      onChange={(e) =>
                        setAttendance((prev) => ({
                          ...prev,
                          [s._id]: {
                            ...prev[s._id],
                            present: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </td>

                  <td className="border p-2">
                    <input
                      type="number"
                      className="w-20 p-1 border rounded"
                      value={attendance[s._id]?.total || ""}
                      onChange={(e) =>
                        setAttendance((prev) => ({
                          ...prev,
                          [s._id]: {
                            ...prev[s._id],
                            total: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={submitAttendance}
            className="bg-green-600 text-white px-4 py-2 rounded mt-4"
          >
            Submit Attendance
          </button>
        </>
      )}
    </div>
  );
}
