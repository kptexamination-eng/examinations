"use client";

import { useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

export default function HODIAApproval() {
  const { getToken } = useAuth();

  const [semesters] = useState([1, 2, 3, 4, 5, 6]);
  const [selectedSem, setSelectedSem] = useState("");

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");

  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedIds, setSelectedIds] = useState(new Set());

  const [progress, setProgress] = useState(null);
  const [showOverlay, setShowOverlay] = useState(null);

  const loadSubjects = async (semester) => {
    const token = await getToken();
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/subjects/getsubjects?semester=${semester}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setSubjects(res.data.data);
  };

  const loadPendingIA = async () => {
    if (!selectedSubject) return;

    setLoading(true);

    const token = await getToken();
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ia/pending/subject/${selectedSubject}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setPending(res.data);
    setSelectedIds(new Set());
    setLoading(false);
  };

  /* -------------------- Approve One -------------------- */
  const approveOne = async (id) => {
    const token = await getToken();

    setShowOverlay("processing");

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ia/approve/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadPendingIA();

      setShowOverlay("success");
      setTimeout(() => setShowOverlay(null), 1500);
    } catch {
      setShowOverlay("error");
      setTimeout(() => setShowOverlay(null), 1500);
    }
  };

  /* -------------------- Reject One -------------------- */
  const rejectOne = async (id) => {
    const token = await getToken();

    setShowOverlay("processing");

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ia/reject/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadPendingIA();

      setShowOverlay("reject");
      setTimeout(() => setShowOverlay(null), 1500);
    } catch {
      setShowOverlay("error");
      setTimeout(() => setShowOverlay(null), 1500);
    }
  };

  /* -------------------- Approve Selected (Bulk) -------------------- */
  const approveAll = async () => {
    if (selectedIds.size === 0) return;

    const token = await getToken();

    const ids = Array.from(selectedIds);
    setProgress({ completed: 0, total: ids.length });

    try {
      let count = 0;

      for (const id of ids) {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/ia/approve/${id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        count++;
        setProgress({ completed: count, total: ids.length });
      }

      setProgress(null);
      setShowOverlay("success");

      loadPendingIA();
      setTimeout(() => setShowOverlay(null), 1500);
    } catch {
      setProgress(null);
      setShowOverlay("error");
      setTimeout(() => setShowOverlay(null), 1500);
    }
  };

  /* -------------------- Reject Selected (Bulk) -------------------- */
  const rejectAll = async () => {
    if (selectedIds.size === 0) return;

    const token = await getToken();

    const ids = Array.from(selectedIds);
    setProgress({ completed: 0, total: ids.length });

    try {
      let count = 0;

      for (const id of ids) {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/ia/reject/${id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        count++;
        setProgress({ completed: count, total: ids.length });
      }

      setProgress(null);
      setShowOverlay("reject");

      loadPendingIA();
      setTimeout(() => setShowOverlay(null), 1500);
    } catch {
      setProgress(null);
      setShowOverlay("error");
      setTimeout(() => setShowOverlay(null), 1500);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="font-bold text-xl mb-4">HOD IA Approval</h1>

      {/* SEMESTER SELECT */}
      <label className="font-semibold">Select Semester</label>
      <select
        className="border p-2 rounded w-full mb-4"
        value={selectedSem}
        onChange={(e) => {
          setSelectedSem(e.target.value);
          loadSubjects(e.target.value);
          setPending([]);
          setSelectedSubject("");
        }}
      >
        <option value="">-- Select Semester --</option>
        {semesters.map((s) => (
          <option key={s}>{`Semester ${s}`}</option>
        ))}
      </select>

      {/* SUBJECT SELECT */}
      {subjects.length > 0 && (
        <>
          <label className="font-semibold">Select Subject</label>
          <select
            className="border p-2 rounded w-full mb-4"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">-- Select Subject --</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>

          <button
            onClick={loadPendingIA}
            className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
          >
            Load Pending IA
          </button>
        </>
      )}

      {/* TABLE */}
      {loading && <p>Loading...</p>}

      {!loading && pending.length > 0 && (
        <>
          {/* BULK ACTION BUTTONS */}
          <div className="flex gap-3 mb-3">
            <button
              onClick={approveAll}
              className="bg-green-700 text-white px-4 py-2 rounded"
            >
              Approve Selected ({selectedIds.size})
            </button>

            <button
              onClick={rejectAll}
              className="bg-red-700 text-white px-4 py-2 rounded"
            >
              Reject Selected ({selectedIds.size})
            </button>
          </div>

          <table className="w-full border text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 border"></th>
                <th className="p-2 border">USN</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Final IA</th>
                <th className="p-2 border">Max</th>
                <th className="p-2 border">Eligibility</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>

            <tbody>
              {pending.map((p) => (
                <tr key={p._id}>
                  <td className="p-2 border text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p._id)}
                      onChange={() => {
                        const set = new Set(selectedIds);
                        if (set.has(p._id)) set.delete(p._id);
                        else set.add(p._id);
                        setSelectedIds(set);
                      }}
                    />
                  </td>

                  <td className="p-2 border">{p.studentId.registerNumber}</td>
                  <td className="p-2 border">{p.studentId.name}</td>
                  <td className="p-2 border">{p.finalIA}</td>
                  <td className="p-2 border">{p.maxMarks}</td>

                  <td
                    className={`p-2 border font-bold ${
                      p.isEligible ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {p.isEligible ? "Eligible" : "Not Eligible"}
                  </td>

                  <td className="p-2 border flex gap-2">
                    <button
                      onClick={() => approveOne(p._id)}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => rejectOne(p._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* OVERLAYS */}
      {showOverlay === "processing" && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 backdrop-blur-sm">
          <div className="bg-white px-10 py-6 rounded-xl shadow-xl text-xl font-bold text-blue-700 animate-pulse">
            Processing...
          </div>
        </div>
      )}

      {showOverlay === "success" && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white px-10 py-6 rounded-xl shadow-xl text-2xl font-bold text-green-700 animate-fade">
            IA Approved Successfully!
          </div>
        </div>
      )}

      {showOverlay === "reject" && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white px-10 py-6 rounded-xl shadow-xl text-2xl font-bold text-red-700 animate-fade">
            IA Rejected!
          </div>
        </div>
      )}

      {progress && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white px-12 py-8 rounded-xl shadow-2xl text-center">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">
              Approving...
            </h2>
            <p className="text-xl font-semibold text-gray-800">
              {progress.completed} / {progress.total} completed
            </p>
          </div>
        </div>
      )}

      {!loading && selectedSubject && pending.length === 0 && (
        <p className="text-gray-600 mt-3">No pending IA records.</p>
      )}
    </div>
  );
}
