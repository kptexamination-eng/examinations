"use client";

import { useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

export default function HODIAApproval() {
  const { getToken } = useAuth();

  const [semesters] = useState([1, 2, 3, 4, 5, 6, 7, 8]);
  const [selectedSem, setSelectedSem] = useState("");

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");

  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load subjects for semester
  const loadSubjects = async (semester) => {
    const token = await getToken();

    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/subjects/getsubjects?semester=${semester}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setSubjects(res.data.data);
  };

  // Load pending IA for subject
  const loadPendingIA = async () => {
    if (!selectedSubject) return;

    setLoading(true);

    const token = await getToken();
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ia/pending/subject/${selectedSubject}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setPending(res.data);
    setLoading(false);
  };

  const approve = async (id) => {
    const token = await getToken();
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ia/approve/${id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    loadPendingIA();
  };

  const reject = async (id) => {
    const token = await getToken();
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ia/reject/${id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    loadPendingIA();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="font-bold text-xl mb-4">HOD IA Approval</h1>

      {/* STEP 1: SELECT SEMESTER */}
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
          <option key={s} value={s}>
            Semester {s}
          </option>
        ))}
      </select>

      {/* STEP 2: SELECT SUBJECT */}
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

      {/* STEP 3: TABLE */}
      {loading && <p>Loading...</p>}

      {!loading && pending.length > 0 && (
        <table className="w-full border text-sm">
          <thead className="bg-gray-200">
            <tr>
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
                <td className="p-2 border">{p.studentId?.registerNumber}</td>
                <td className="p-2 border">{p.studentId?.name}</td>
                <td className="p-2 border">{p.finalIA}</td>
                <td className="p-2 border">{p.maxMarks}</td>
                <td className="p-2 border">
                  {p.isEligible ? "Eligible" : "Not Eligible"}
                </td>

                <td className="p-2 border flex gap-2">
                  <button
                    onClick={() => approve(p._id)}
                    className="bg-green-600 text-white px-2 py-1 rounded"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => reject(p._id)}
                    className="bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && selectedSubject && pending.length === 0 && (
        <p className="text-gray-600">No pending IA records.</p>
      )}
    </div>
  );
}
