"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { Loader2, FileSpreadsheet, Download } from "lucide-react";

export default function EligibilityReport() {
  const { getToken } = useAuth();

  const [allocations, setAllocations] = useState([]);
  const [semester, setSemester] = useState("");
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [selected, setSelected] = useState("");

  const [records, setRecords] = useState([]);

  const [loadingAlloc, setLoadingAlloc] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // ----------------------------------------------------------------
  // LOAD ALL ALLOCATIONS
  // ----------------------------------------------------------------
  const loadAllocations = async () => {
    setLoadingAlloc(true);
    const token = await getToken();

    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subject-allocations/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(res.data.data);
      setAllocations(res.data.data);
    } finally {
      setLoadingAlloc(false);
    }
  };

  useEffect(() => {
    loadAllocations();
  }, []);

  // ----------------------------------------------------------------
  // FILTER SUBJECTS BASED ON SEMESTER
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!semester) {
      setFilteredSubjects([]);
      return;
    }

    const filtered = allocations.filter(
      (a) => String(a.semester) === String(semester)
    );

    setFilteredSubjects(filtered);
  }, [semester, allocations]);

  // ----------------------------------------------------------------
  // LOAD IA RECORDS
  // ----------------------------------------------------------------
  const loadRecords = async () => {
    if (!selected) return;

    setLoadingRecords(true);
    const token = await getToken();

    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ia/final/${selected}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecords(res.data);
    } finally {
      setLoadingRecords(false);
    }
  };

  // ----------------------------------------------------------------
  // SHARED PDF DOWNLOAD
  // ----------------------------------------------------------------
  // ----------------------------------------------------------------
  // NEW PDF EXPORT FUNCTION FOR IA (Professional format)
  // ----------------------------------------------------------------
  const exportPDF = async (list, title, fileName) => {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;

    const loadImage = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.src = src;
      });

    // Load logos from public folder
    const leftImg = await loadImage("/logo.jpg");
    const rightImg = await loadImage("/logo2.png");

    const doc = new jsPDF("p", "mm", "a4");

    // BORDER
    doc.setLineWidth(0.5);
    doc.rect(5, 5, 200, 287);

    // LOGOS
    doc.addImage(leftImg, "PNG", 10, 10, 25, 25);
    doc.addImage(rightImg, "PNG", 175, 10, 25, 25);

    // FULL HEADER
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("GOVERNMENT OF KARNATAKA", 105, 15, { align: "center" });

    doc.setFontSize(11);
    doc.text("DEPARTMENT OF COLLEGIATE AND TECHNICAL EDUCATION", 105, 22, {
      align: "center",
    });

    doc.setFontSize(13);
    doc.text("KARNATAKA (GOVT.) POLYTECHNIC, MANGALURU", 105, 29, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.text(
      "(First Autonomous Polytechnic in India from AICTE, New Delhi)",
      105,
      35,
      { align: "center" }
    );

    doc.text(
      "Kadri Hills, Mangaluru–575004, Dakshina Kannada, Karnataka",
      105,
      41,
      { align: "center" }
    );

    // WATERMARK
    doc.setTextColor(200);
    doc.setFontSize(38);
    doc.text("KPT MANGALURU", 35, 160, { angle: 45, opacity: 0.15 });
    doc.setTextColor(0);

    // SUBJECT DETAILS
    const selectedAllocation = filteredSubjects.find((f) => f._id === selected);
    const subjectName = selectedAllocation?.subject?.name || "";
    const subjectCode = selectedAllocation?.subject?.code || "";

    // LABEL + VALUE COLORING
    const labelColor = [75, 0, 130]; // Indigo
    const valueColor = [0, 0, 0];

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...labelColor);
    doc.text("Subject Code:", 15, 55);
    doc.setTextColor(...valueColor);
    doc.text(subjectCode, 55, 55);

    doc.setTextColor(...labelColor);
    doc.text("Subject Name:", 15, 62);
    doc.setTextColor(...valueColor);
    doc.text(subjectName, 55, 62);

    // MAIN TITLE (Eligible / Not Eligible)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 51, 153);
    doc.text(title, 105, 75, { align: "center" });

    // TABLE
    autoTable(doc, {
      startY: 82,
      head: [["SL", "USN", "Name", "Final IA", "Max", "Eligible"]],
      body: list.map((r, i) => [
        i + 1,
        r.studentId?.registerNumber || "—",
        r.studentId?.name || "—",
        r.finalIA,
        r.maxMarks,
        r.isEligible ? "Yes" : "No",
      ]),
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 102, 204] },
    });

    // SIGNATURE AREA
    const finalY = doc.lastAutoTable.finalY + 20;

    doc.setFontSize(11);
    doc.setTextColor(0);

    doc.setFontSize(11);
    doc.text("__________________________", 20, finalY);
    doc.text("Staff Signature", 20, finalY + 6);
    doc.text("Karnataka (Govt.) Polytechnic", 20, finalY + 12);
    doc.text("Mangaluru", 20, finalY + 18);

    doc.text("__________________________", 140, finalY);
    doc.text("Head of Department", 140, finalY + 6);
    doc.text("Karnataka (Govt.) Polytechnic", 140, finalY + 12);
    doc.text("Mangaluru", 140, finalY + 18);

    // FOOTER
    doc.setFontSize(8);
    doc.text(
      "Karnataka (Govt.) Polytechnic, Mangaluru — https://kptmangalore.in — 0824-2215498",
      105,
      290,
      { align: "center" }
    );

    doc.save(fileName);
  };

  const exportEligible = () =>
    exportPDF(
      records.filter((r) => r.isEligible),
      "Eligible Students Report",
      "EligibleStudents.pdf"
    );

  const exportNotEligible = () =>
    exportPDF(
      records.filter((r) => !r.isEligible),
      "Not Eligible Students Report",
      "NotEligibleStudents.pdf"
    );

  // ----------------------------------------------------------------
  // UI
  // ----------------------------------------------------------------
  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow-xl rounded-xl border">
      <h1 className="text-2xl font-bold mb-6 text-blue-700 flex items-center gap-2">
        <FileSpreadsheet className="w-7 h-7 text-blue-600" />
        IA Eligibility Report
      </h1>

      {/* SEMESTER SELECT */}
      <label className="block mb-3 font-medium">Select Semester</label>
      <select
        className="border p-2 w-full rounded-md mb-6"
        value={semester}
        onChange={(e) => {
          setSemester(e.target.value);
          setSelected("");
          setRecords([]);
        }}
      >
        <option value="">-- Select Semester --</option>
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <option key={s} value={s}>
            Semester {s}
          </option>
        ))}
      </select>

      {/* SUBJECT SELECT */}
      <label className="block mb-3 font-medium">Select Subject</label>
      {loadingAlloc ? (
        <p className="text-blue-600 flex items-center gap-2">
          <Loader2 className="animate-spin" /> Loading subjects...
        </p>
      ) : (
        <select
          className="border p-2 w-full rounded-md mb-4"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={!semester}
        >
          <option value="">-- Select Subject --</option>
          {filteredSubjects.map((a) => (
            <option key={a._id} value={a._id}>
              {a.subject.code} - {a.subject.name}
            </option>
          ))}
        </select>
      )}

      {/* LOAD RECORDS BUTTON */}
      <button
        onClick={loadRecords}
        disabled={!selected || loadingRecords}
        className="bg-blue-600 text-white px-4 py-2 rounded-md mb-4 w-full flex justify-center items-center gap-2 disabled:opacity-50"
      >
        {loadingRecords ? (
          <>
            <Loader2 className="animate-spin" /> Loading IA Records...
          </>
        ) : (
          "Load IA Records"
        )}
      </button>

      {/* EXPORT BUTTONS */}
      {records.length > 0 && (
        <div className="flex gap-4 mb-6">
          <button
            onClick={exportEligible}
            className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export Eligible
          </button>

          <button
            onClick={exportNotEligible}
            className="bg-red-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export Not Eligible
          </button>
        </div>
      )}

      {/* IA TABLE */}
      {records.length > 0 && (
        <table className="w-full text-sm border rounded-md overflow-hidden">
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
                <td
                  className={`p-2 border font-semibold ${
                    r.isEligible ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {r.isEligible ? "Eligible" : "Not Eligible"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* NO DATA MESSAGE */}
      {selected && !loadingRecords && records.length === 0 && (
        <p className="text-gray-500 mt-4 text-center">
          No IA records found for this subject.
        </p>
      )}
    </div>
  );
}
