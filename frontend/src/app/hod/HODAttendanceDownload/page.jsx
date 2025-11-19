"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function HODAttendanceDownload() {
  const { getToken } = useAuth();
  const [allocations, setAllocations] = useState([]);
  const [selected, setSelected] = useState("");
  const [records, setRecords] = useState([]);

  const loadAllocations = async () => {
    const token = await getToken();
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/subject-allocations/hod`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setAllocations(res.data.data);
  };

  const loadRecords = async () => {
    const token = await getToken();
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/pending/${selected}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setRecords(res.data);
  };

  const downloadEligible = () => {
    const doc = new jsPDF();
    doc.text("Eligible Attendance List", 14, 15);

    const eligible = records.filter((r) => (r.present / r.total) * 100 >= 75);

    autoTable(doc, {
      startY: 20,
      head: [["USN", "Name", "%"]],
      body: eligible.map((r) => [
        r.studentId.registerNumber,
        r.studentId.name,
        ((r.present / r.total) * 100).toFixed(1),
      ]),
    });

    doc.save("Eligible-Attendance.pdf");
  };

  const downloadNonEligible = () => {
    const doc = new jsPDF();
    doc.text("Non-Eligible Attendance List", 14, 15);

    const non = records.filter((r) => (r.present / r.total) * 100 < 75);

    autoTable(doc, {
      startY: 20,
      head: [["USN", "Name", "%"]],
      body: non.map((r) => [
        r.studentId.registerNumber,
        r.studentId.name,
        ((r.present / r.total) * 100).toFixed(1),
      ]),
    });

    doc.save("NonEligible-Attendance.pdf");
  };

  useEffect(() => {
    loadAllocations();
  }, []);

  return (
    <div className="p-6">
      <h1 className="font-bold text-xl mb-4">Attendance Report Download</h1>

      <select
        className="border p-2 mb-4"
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="">-- Select Subject --</option>
        {allocations.map((a) => (
          <option key={a._id} value={a._id}>
            {a.subject.code} - {a.subject.name}
          </option>
        ))}
      </select>

      <button
        onClick={loadRecords}
        className="bg-blue-600 text-white p-2 rounded mb-4"
      >
        Load Records
      </button>

      {records.length > 0 && (
        <>
          <button
            onClick={downloadEligible}
            className="bg-green-600 text-white p-2 rounded mr-3"
          >
            Download Eligible
          </button>

          <button
            onClick={downloadNonEligible}
            className="bg-red-600 text-white p-2 rounded"
          >
            Download Not Eligible
          </button>
        </>
      )}
    </div>
  );
}
