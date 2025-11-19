"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

export default function EligibilityReport() {
  const { getToken } = useAuth();
  const [allocations, setAllocations] = useState([]);
  const [selected, setSelected] = useState("");
  const [records, setRecords] = useState([]);

  useEffect(() => {
    (async () => {
      const token = await getToken();

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subject-allocations/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAllocations(res.data.data);
    })();
  }, []);

  const loadRecords = async () => {
    const token = await getToken();
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ia/final/${selected}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setRecords(res.data);
  };

  // ----------------------------
  // SHARED PDF FUNCTION
  // ----------------------------
  const exportPDF = async (list, title, fileName) => {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();

    doc.text(title, 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [["USN", "Name", "Final IA", "Max", "Eligible"]],
      body: list.map((r) => [
        r.studentId?.registerNumber || "—",
        r.studentId?.name || "—",
        r.finalIA,
        r.maxMarks,
        r.isEligible ? "Yes" : "No",
      ]),
    });

    doc.save(fileName);
  };

  const exportEligible = () => {
    const eligible = records.filter((r) => r.isEligible);
    exportPDF(eligible, "Eligible Students Report", "EligibleStudents.pdf");
  };

  const exportNotEligible = () => {
    const notEligible = records.filter((r) => !r.isEligible);
    exportPDF(
      notEligible,
      "Not Eligible Students Report",
      "NotEligibleStudents.pdf"
    );
  };

  return (
    <div className="p-6">
      <h1 className="font-bold text-xl mb-4">Eligibility Report</h1>

      <select
        className="border p-2 mb-4"
        value={selected}
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
        className="bg-blue-600 p-2 text-white rounded mb-4"
      >
        Load Records
      </button>

      {records.length > 0 && (
        <>
          {/* BUTTONS */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={exportEligible}
              className="bg-green-600 p-2 text-white rounded"
            >
              Export Eligible
            </button>

            <button
              onClick={exportNotEligible}
              className="bg-red-600 p-2 text-white rounded"
            >
              Export Not Eligible
            </button>
          </div>

          {/* TABLE */}
          <table className="w-full text-sm border">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 border">USN</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Final IA</th>
                <th className="p-2 border">Max</th>
                <th className="p-2 border">Eligible</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td className="p-2 border">
                    {r.studentId?.registerNumber || "—"}
                  </td>
                  <td className="p-2 border">{r.studentId?.name || "—"}</td>
                  <td className="p-2 border">{r.finalIA}</td>
                  <td className="p-2 border">{r.maxMarks}</td>
                  <td className="p-2 border">
                    {r.isEligible ? "Eligible" : "Not Eligible"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
