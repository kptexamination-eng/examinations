"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import Swal from "sweetalert2";

export default function StaffAttendanceEntry() {
  const { getToken } = useAuth();

  const [allocations, setAllocations] = useState([]);
  const [selectedAlloc, setSelectedAlloc] = useState("");

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [commonTotal, setCommonTotal] = useState("");

  const [isApproved, setIsApproved] = useState(false); // ✅ FIXED (added)
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ------------ REMOVE SPINNER FROM NUMBER INPUT ---------- */
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type="number"] {
        -moz-appearance: textfield;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  /* ------------ ARROW KEY NAVIGATION ---------------------- */
  const handleArrowNavigation = (e, currentId, field) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();

    const idx = students.findIndex((s) => s._id === currentId);
    if (idx === -1) return;

    const nextIndex = e.key === "ArrowDown" ? idx + 1 : idx - 1;
    if (nextIndex < 0 || nextIndex >= students.length) return;

    const nextStudent = students[nextIndex];
    const nextInput = document.getElementById(`${nextStudent._id}-${field}`);
    if (nextInput) nextInput.focus();
  };

  /* ----------------- LOAD ALLOCATIONS ---------------------- */
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

  /* ---------------------- LOAD STUDENTS -------------------- */
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

      // Prepare empty attendance object
      const att = {};
      validStudents.forEach((stu) => {
        att[stu._id] = {
          present: "",
          total: "",
          manuallyChanged: false,
        };
      });

      setAttendance(att);

      /* ---------- CHECK IF APPROVED ALREADY ---------- */
      const final = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/final/${selectedAlloc}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (final.data.length > 0) {
        setIsApproved(true);

        // Fill approved values in read-only mode
        const finalData = {};
        final.data.forEach((rec) => {
          finalData[rec.studentId._id] = {
            present: rec.presentHours,
            total: rec.totalHours,
            percentage: rec.percentage,
            isEligible: rec.isEligible,
          };
        });

        setAttendance(finalData);
        return;
      }

      setIsApproved(false);
    } catch (err) {
      console.error("Error loading students:", err);
    } finally {
      setLoading(false);
    }
  };

  /* --------------------- APPLY COMMON TOTAL ---------------- */
  const applyCommonTotal = () => {
    if (isApproved) return; // prevent change after approval

    setAttendance((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((sid) => {
        if (!updated[sid].manuallyChanged) {
          updated[sid].total = Number(commonTotal);
        }
      });
      return updated;
    });
  };

  /* --------------------- SUBMIT ATTENDANCE ----------------- */
  const submitAttendance = async () => {
    setSubmitting(true);

    try {
      const token = await getToken();

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/submit`,
        {
          subjectAllocationId: selectedAlloc,
          attendance,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire(
        "Success!",
        "Attendance submitted for HOD approval.",
        "success"
      );
    } catch (err) {
      Swal.fire(
        "Error!",
        err.response?.data?.message || "Failed to submit attendance.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================== UI =========================== */

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Attendance Entry</h1>

      {submitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center text-white text-xl">
          Submitting...
        </div>
      )}

      {/* SUBJECT SELECT */}
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

      {isApproved && (
        <p className="text-red-600 font-bold mb-2">
          Attendance already approved. You cannot edit.
        </p>
      )}

      {students.length > 0 && (
        <>
          {/* COMMON TOTAL */}
          <div className="bg-yellow-100 border p-3 rounded mb-3">
            <label className="font-semibold">
              Total Classes Held (Common):
            </label>
            <div className="flex gap-3 mt-1">
              <input
                type="number"
                value={commonTotal}
                className="border p-2 rounded w-40"
                disabled={isApproved}
                onChange={(e) => setCommonTotal(e.target.value)}
              />
              <button
                onClick={applyCommonTotal}
                className="bg-green-600 text-white px-3 py-1 rounded"
                disabled={isApproved}
              >
                Apply to All
              </button>
            </div>
          </div>

          {/* TABLE */}
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

                  {/* PRESENT */}
                  <td className="border p-2">
                    <input
                      id={`${s._id}-present`}
                      type="number"
                      className="w-20 p-1 border rounded"
                      disabled={isApproved}
                      value={attendance[s._id]?.present || ""}
                      onKeyDown={(e) =>
                        handleArrowNavigation(e, s._id, "present")
                      }
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

                  {/* TOTAL */}
                  <td className="border p-2">
                    <input
                      id={`${s._id}-total`}
                      type="number"
                      className="w-20 p-1 border rounded"
                      disabled={isApproved}
                      value={attendance[s._id]?.total || ""}
                      onKeyDown={(e) =>
                        handleArrowNavigation(e, s._id, "total")
                      }
                      onChange={(e) =>
                        setAttendance((prev) => ({
                          ...prev,
                          [s._id]: {
                            ...prev[s._id],
                            total: Number(e.target.value),
                            manuallyChanged: true,
                          },
                        }))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!isApproved && (
            <button
              onClick={submitAttendance}
              className="bg-green-600 text-white px-4 py-2 rounded mt-4"
            >
              Submit Attendance
            </button>
          )}
        </>
      )}
    </div>
  );
}
