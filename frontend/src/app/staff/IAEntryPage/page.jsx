"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

export default function IAEntryPage() {
  const { getToken } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [selectedAllocation, setSelectedAllocation] = useState("");

  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [maxMarks, setMaxMarks] = useState(null);
  const [isApproved, setIsApproved] = useState(false);

  const [loadingOverlay, setLoadingOverlay] = useState(false);
  const [successOverlay, setSuccessOverlay] = useState(false);

  const inputRefs = useRef({});

  /* ---------------------- Load subjects ---------------------- */
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/subject-allocations/staff`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSubjects(res.data.data || []);
      } catch {}
    };
    loadSubjects();
  }, []);

  /* ---------------------- Load Students + IA ---------------------- */
  const loadStudents = async () => {
    if (!selectedAllocation) return;

    setLoadingOverlay(true);

    try {
      const token = await getToken();
      const allocation = subjects.find((s) => s._id === selectedAllocation);

      setMaxMarks(allocation.subject.iaMaxMarks);

      // STEP 1 — load students
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/getstudents?department=${allocation.department}&semester=${allocation.semester}&section=${allocation.section}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const list = res.data.data || [];
      setStudents(list);

      const temp = {};
      list.forEach((s) => (temp[s._id] = ""));
      setMarks(temp);

      // STEP 2 — Load approved IA
      const final = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ia/final/${selectedAllocation}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (final.data.length > 0) {
        setIsApproved(true);

        const approved = {};
        final.data.forEach((rec) => {
          approved[rec.studentId._id] = rec.finalIA;
        });

        setMarks(approved);

        setLoadingOverlay(false);
        return;
      }

      // STEP 3 — Load pending IA
      const pending = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ia/pending/${selectedAllocation}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (pending.data.length > 0) {
        setIsApproved(false);

        const pend = {};
        pending.data.forEach((rec) => {
          pend[rec.studentId._id] = rec.finalIA;
        });

        setMarks(pend);
        setLoadingOverlay(false);
        return;
      }

      // STEP 4 — Fresh entry
      setIsApproved(false);
    } catch (err) {
    } finally {
      setLoadingOverlay(false);
    }
  };

  const disableWheel = (e) => {
    e.preventDefault();
    e.target.blur();
  };

  const handleMarkChange = (sid, value) => {
    if (value < 0) value = 0;
    if (value > maxMarks) value = maxMarks;

    setMarks((prev) => ({ ...prev, [sid]: value }));
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") e.preventDefault();

    if (e.key === "ArrowDown" || e.key === "Enter")
      inputRefs.current[index + 1]?.focus();

    if (e.key === "ArrowUp") inputRefs.current[index - 1]?.focus();
  };

  /* ---------------------- Submit IA ---------------------- */
  const submitIA = async () => {
    try {
      const token = await getToken();

      for (const v of Object.values(marks)) {
        if (v === "" || v === null) return;
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ia/pending`,
        { subjectAllocationId: selectedAllocation, marks },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessOverlay(true);
      setTimeout(() => setSuccessOverlay(false), 2000);
    } catch {}
  };

  return (
    <>
      {/* 🟦 FULL SCREEN LOADING OVERLAY */}
      {loadingOverlay && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white px-12 py-8 rounded-2xl shadow-xl animate-pulse text-2xl font-bold text-blue-700">
            Loading Students...
          </div>
        </div>
      )}

      {/* 🟩 SUCCESS OVERLAY */}
      {successOverlay && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white px-10 py-6 rounded-xl shadow-xl text-2xl font-bold text-green-700 animate-fade">
            IA Submitted Successfully!
          </div>
        </div>
      )}

      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Internal Assessment Entry</h1>

        {/* Subject Select */}
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
          className="bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700 transition"
        >
          Load Students
        </button>

        {maxMarks !== null && (
          <div className="mb-4 font-semibold text-lg">
            IA Maximum Marks: <span className="text-blue-600">{maxMarks}</span>
          </div>
        )}

        {/* TABLE */}
        {students.length > 0 && (
          <div>
            <table className="w-full border text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border p-2 w-14">SL</th>
                  <th className="border p-2 w-20">Image</th>
                  <th className="border p-2">USN</th>
                  <th className="border p-2">Name</th>
                  <th className="border p-2 w-32">Final IA</th>
                </tr>
              </thead>

              <tbody>
                {students.map((stu, index) => (
                  <tr key={stu._id} className="hover:bg-gray-50 transition">
                    <td className="border p-2 text-center">{index + 1}</td>

                    <td className="border p-2 text-center">
                      <img
                        src={stu.imageUrl || "/avatar.png"}
                        className="w-10 h-10 rounded-full object-cover mx-auto shadow-md"
                      />
                    </td>

                    <td className="border p-2">{stu.registerNumber}</td>
                    <td className="border p-2">{stu.name}</td>

                    <td className="border p-2">
                      <input
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="number"
                        className="w-24 border p-1 rounded shadow-sm"
                        min="0"
                        max={maxMarks}
                        disabled={isApproved}
                        value={marks[stu._id]}
                        onWheel={disableWheel}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onChange={(e) =>
                          !isApproved &&
                          handleMarkChange(stu._id, Number(e.target.value))
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!isApproved && (
              <button
                onClick={submitIA}
                className="bg-green-600 text-white px-4 py-2 rounded mt-4 hover:bg-green-700 transition"
              >
                Submit for HOD Approval
              </button>
            )}
          </div>
        )}

        {isApproved && (
          <p className="text-red-600 font-bold text-lg mt-4">
            IA already approved — Editing disabled.
          </p>
        )}

        <style>{`
          .animate-fade {
            animation: fadeInOut 2s ease;
          }
          @keyframes fadeInOut {
            0% { opacity: 0; transform: scale(0.9); }
            10% { opacity: 1; transform: scale(1); }
            90% { opacity: 1; }
            100% { opacity: 0; transform: scale(0.9); }
          }
        `}</style>
      </div>
    </>
  );
}
