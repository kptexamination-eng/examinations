"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import Swal from "sweetalert2";

export default function HODAttendanceApproval() {
  const { getToken } = useAuth();

  const [semesters] = useState([1, 2, 3, 4, 5, 6]);
  const [selectedSem, setSelectedSem] = useState("");

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");

  const [pending, setPending] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());

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

  // Load pending attendance
  const loadPendingAttendance = async () => {
    if (!selectedSubject) return;

    setLoading(true);

    const token = await getToken();

    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/pending/subject/${selectedSubject}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setPending(res.data);
    setSelectedIds(new Set());
    setLoading(false);
  };

  // Single approval
  const approveOne = async (id) => {
    const token = await getToken();

    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/approve/${id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    loadPendingAttendance();
  };

  // Approve Selected
  const approveSelected = async () => {
    if (selectedIds.size === 0)
      return Swal.fire("No selection", "Select records to approve", "warning");

    const ids = Array.from(selectedIds);

    const confirm = await Swal.fire({
      title: "Approve selected records?",
      text: `${ids.length} attendance records will be approved.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Approve",
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({
      title: "Approving...",
      html: `<b>0 / ${ids.length}</b> completed`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    let completed = 0;
    const token = await getToken();

    for (const id of ids) {
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/approve/${id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {}

      completed++;

      Swal.update({
        html: `<b>${completed} / ${ids.length}</b> completed`,
      });
    }

    Swal.fire("Done", "Selected attendance approved!", "success");

    loadPendingAttendance();
  };

  // Approve All
  const approveAll = async () => {
    if (pending.length === 0)
      return Swal.fire("Nothing to approve", "", "info");

    const confirm = await Swal.fire({
      title: "Approve ALL records?",
      text: `${pending.length} attendance entries will be approved.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Approve All",
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({
      title: "Approving all...",
      html: `<b>0 / ${pending.length}</b> completed`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const token = await getToken();
    let completed = 0;

    for (const p of pending) {
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/approve/${p._id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {}

      completed++;

      Swal.update({
        html: `<b>${completed} / ${pending.length}</b> completed`,
      });
    }

    Swal.fire("Success", "All attendance records approved", "success");

    loadPendingAttendance();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="font-bold text-xl mb-4">HOD Attendance Approval</h1>

      {/* Select Semester */}
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

      {/* Select Subject */}
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
            onClick={loadPendingAttendance}
            className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
          >
            Load Pending Attendance
          </button>
        </>
      )}

      {/* Pending Records Table */}
      {loading && <p>Loading...</p>}

      {!loading && pending.length > 0 && (
        <>
          <div className="flex justify-between mb-3">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={approveSelected}
            >
              Approve Selected ({selectedIds.size})
            </button>

            <button
              className="bg-purple-600 text-white px-4 py-2 rounded"
              onClick={approveAll}
            >
              Approve All ({pending.length})
            </button>
          </div>

          <table className="w-full border text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 border">
                  <input
                    type="checkbox"
                    checked={
                      pending.length > 0 &&
                      pending.every((p) => selectedIds.has(p._id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(pending.map((p) => p._id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                </th>
                <th className="p-2 border">USN</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Present</th>
                <th className="p-2 border">Total</th>
                <th className="p-2 border">%</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((p) => (
                <tr key={p._id}>
                  <td className="p-2 border">
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
                  <td className="p-2 border">{p.presentHours}</td>
                  <td className="p-2 border">{p.totalHours}</td>
                  <td className="p-2 border">{p.percentage.toFixed(1)}</td>

                  <td className="p-2 border">
                    <button
                      onClick={() => approveOne(p._id)}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {!loading && selectedSubject && pending.length === 0 && (
        <p className="text-gray-600">🎉 No pending records. All approved.</p>
      )}
    </div>
  );
}
