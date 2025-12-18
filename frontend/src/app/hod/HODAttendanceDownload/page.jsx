"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Loader2, Download, FileSpreadsheet } from "lucide-react";

export default function HODAttendanceDownload() {
  const { getToken } = useAuth();

  const [allocations, setAllocations] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);

  const [semester, setSemester] = useState("");
  const [selected, setSelected] = useState("");

  const [records, setRecords] = useState([]);
  const [loadingAlloc, setLoadingAlloc] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);

  //-------------------------------------
  // LOAD ALL ALLOCATIONS
  //-------------------------------------
  const loadAllocations = async () => {
    setLoadingAlloc(true);
    const token = await getToken();

    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subject-allocations/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAllocations(res.data.data);
    } finally {
      setLoadingAlloc(false);
    }
  };

  //-------------------------------------
  // FILTER SUBJECTS BASED ON SEMESTER
  //-------------------------------------
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

  //-------------------------------------
  // LOAD FINALIZED ATTENDANCE RECORDS
  //-------------------------------------
  const loadRecords = async () => {
    if (!selected) return;

    setLoadingRecords(true);

    const token = await getToken();
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/final/${selected}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Fetched Records:", res.data);
      setRecords(res.data);
    } finally {
      setLoadingRecords(false);
    }
  };
  const downloadEligible = async () => {
    const loadImage = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.src = src;
      });

    const leftImg = await loadImage("/logo.jpg");
    const rightImg = await loadImage("/logo2.png");

    const doc = new jsPDF("p", "mm", "a4");

    // PAGE BORDER
    doc.setLineWidth(0.5);
    doc.rect(5, 5, 200, 287);

    // LOGOS
    doc.addImage(leftImg, "PNG", 12, 10, 22, 22);
    doc.addImage(rightImg, "PNG", 176, 10, 22, 22);

    // HEADER TEXT
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(0, 102, 204);
    doc.text("GOVERNMENT OF KARNATAKA", 105, 16, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(200, 0, 0);
    doc.text("DEPARTMENT OF COLLEGIATE AND TECHNICAL EDUCATION", 105, 23, {
      align: "center",
    });

    doc.setFontSize(13);
    doc.setTextColor(0, 128, 0);
    doc.text("KARNATAKA (GOVT.) POLYTECHNIC, MANGALURU", 105, 30, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.setTextColor(153, 102, 0);

    doc.text(
      "(First Autonomous Polytechnic in India from AICTE, New Delhi)",
      105,
      36,
      { align: "center" }
    );
    doc.setTextColor(0);
    doc.text(
      "Kadri Hills, Mangaluru–575004, Dakshina Kannada, Karnataka",
      105,
      41,
      { align: "center" }
    );

    // WATERMARK
    doc.setFontSize(38);
    doc.setTextColor(230, 230, 230);
    doc.text("KPT MANGALURU", 30, 160, {
      angle: 45,
    });
    doc.setTextColor(0);

    // SUBJECT DETAILS
    const selectedAllocation = filteredSubjects.find((f) => f._id === selected);
    const subjectName = selectedAllocation?.subject?.name || "";
    const subjectCode = selectedAllocation?.subject?.code || "";

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    // SUBJECT CODE

    doc.setTextColor(204, 85, 0);

    doc.text("Subject Code:", 15, 55);

    // Value (Black)
    doc.setTextColor(0, 0, 0);
    doc.text(subjectCode, 55, 55);

    doc.setTextColor(204, 85, 0);

    doc.text("Subject Name:", 15, 62);

    // Value (Black)
    doc.setTextColor(0, 0, 0);
    doc.text(subjectName, 55, 62);

    doc.setFontSize(14);
    doc.setTextColor(0, 128, 0);
    doc.text("ELIGIBLE CANDIDATE LIST", 105, 72, { align: "center" });
    doc.setTextColor(0);

    // FILTER ELIGIBLE
    const eligible = records.filter((r) => r.percentage >= 75);

    // TABLE
    autoTable(doc, {
      startY: 78,
      head: [["SL", "Reg No", "Name", "Present", "Total", "%"]],
      body: eligible.map((r, i) => [
        i + 1,
        r.studentId.registerNumber,
        r.studentId.name,
        r.presentHours,
        r.totalHours,
        r.percentage.toFixed(1),
      ]),
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 160, 133] },
      margin: { left: 10, right: 10 },
    });

    const finalY = doc.lastAutoTable.finalY + 15;

    // SIGNATURES SECTION (Properly spaced)
    doc.setFontSize(11);

    doc.text("__________________________", 20, finalY);
    doc.text("Staff Signature", 20, finalY + 6);
    doc.text("Karnataka (Govt.) Polytechnic", 20, finalY + 12);
    doc.text("Mangaluru", 20, finalY + 18);

    doc.text("__________________________", 140, finalY);
    doc.text("Head of Department", 140, finalY + 6);
    doc.text("Karnataka (Govt.) Polytechnic", 140, finalY + 12);
    doc.text("Mangaluru", 140, finalY + 18);

    // FOOTER — Always at bottom and NOT overlapping
    doc.setFontSize(8);
    doc.text(
      "Karnataka (Govt.) Polytechnic, Mangaluru — https://kptmangalore.in — 0824-2215498",
      105,
      292,
      { align: "center" }
    );

    doc.save(`Eligible-Attendance-${subjectCode}.pdf`);
  };

  const downloadNonEligible = async () => {
    const loadImage = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.src = src;
      });

    const leftImg = await loadImage("/logo.jpg");
    const rightImg = await loadImage("/logo2.png");

    const doc = new jsPDF("p", "mm", "a4");

    // BORDER
    doc.setLineWidth(0.5);
    doc.rect(5, 5, 200, 287);

    // LOGOS
    doc.addImage(leftImg, "PNG", 12, 10, 22, 22);
    doc.addImage(rightImg, "PNG", 176, 10, 22, 22);

    // HEADER
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(0, 102, 204);
    doc.text("GOVERNMENT OF KARNATAKA", 105, 16, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(200, 0, 0);
    doc.text("DEPARTMENT OF COLLEGIATE AND TECHNICAL EDUCATION", 105, 23, {
      align: "center",
    });

    doc.setFontSize(13);
    doc.setTextColor(0, 128, 0);
    doc.text("KARNATAKA (GOVT.) POLYTECHNIC, MANGALURU", 105, 30, {
      align: "center",
    });

    doc.setFontSize(10);
    // doc.setTextColor(75, 0, 130);
    doc.setTextColor(153, 102, 0);

    doc.text(
      "(First Autonomous Polytechnic in India from AICTE, New Delhi)",
      105,
      36,
      { align: "center" }
    );

    doc.setTextColor(0);
    doc.text(
      "Kadri Hills, Mangaluru–575004, Dakshina Kannada, Karnataka",
      105,
      41,
      { align: "center" }
    );

    // WATERMARK
    doc.setFontSize(38);
    doc.setTextColor(230, 230, 230);
    doc.text("KPT MANGALURU", 30, 160, {
      angle: 45,
    });
    doc.setTextColor(0);

    // SUBJECT DETAILS
    const selectedAllocation = filteredSubjects.find((f) => f._id === selected);
    const subjectName = selectedAllocation?.subject?.name || "";
    const subjectCode = selectedAllocation?.subject?.code || "";

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");

    // Label (Indigo)
    doc.setTextColor(156, 102, 31); // soft brown

    doc.text("Subject Code:", 15, 55);

    // Value (Black)
    doc.setTextColor(0, 0, 0);
    doc.text(subjectCode, 55, 55);

    // SUBJECT NAME
    // Label (Indigo)
    doc.setTextColor(156, 102, 31); // soft brown

    //
    doc.text("Subject Name:", 15, 62);

    // Value (Black)
    doc.setTextColor(0, 0, 0);
    doc.text(subjectName, 55, 62);

    doc.setFontSize(14);
    doc.setTextColor(200, 0, 0);
    doc.text("NON-ELIGIBLE CANDIDATE LIST", 105, 72, { align: "center" });
    doc.setTextColor(0);

    // FILTER NON-ELIGIBLE
    const non = records.filter((r) => r.percentage < 75);

    // TABLE
    autoTable(doc, {
      startY: 78,
      head: [["SL", "Reg No", "Name", "Present", "Total", "%"]],
      body: non.map((r, i) => [
        i + 1,
        r.studentId.registerNumber,
        r.studentId.name,
        r.presentHours,
        r.totalHours,
        r.percentage.toFixed(1),
      ]),
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [220, 53, 69] },
      margin: { left: 10, right: 10 },
    });

    const finalY = doc.lastAutoTable.finalY + 15;

    // SIGNATURES
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
      292,
      { align: "center" }
    );

    doc.save(`NonEligible-Attendance-${subjectCode}.pdf`);
  };

  // LOAD ALLOCATIONS ONCE
  useEffect(() => {
    loadAllocations();
  }, []);

  //-------------------------------------
  // RENDER UI
  //-------------------------------------
  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow-lg rounded-xl">
      <h1 className="font-bold text-2xl mb-6 text-blue-700 flex items-center gap-2">
        <FileSpreadsheet className="w-7 h-7 text-blue-600" />
        Attendance Report Download
      </h1>

      {/* SEMESTER */}
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

      {/* SUBJECT */}
      {semester && (
        <>
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
            >
              <option value="">-- Select Subject --</option>
              {filteredSubjects.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.subject.code} - {a.subject.name}
                </option>
              ))}
            </select>
          )}
        </>
      )}

      {/* LOAD RECORDS */}
      <button
        onClick={loadRecords}
        disabled={!selected || loadingRecords}
        className="bg-blue-600 text-white px-4 py-2 rounded-md mb-4 w-full flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loadingRecords ? (
          <>
            <Loader2 className="animate-spin" /> Fetching Records...
          </>
        ) : (
          "Load Attendance Records"
        )}
      </button>

      {/* PREVIEW TABLE */}
      {/* PREVIEW TABLE */}
      {records.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold text-lg mb-3 text-gray-700">
            Attendance Preview
          </h2>

          <div className="overflow-x-auto border rounded-lg shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">SL</th>
                  <th className="p-2 border">Reg No</th>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Present</th>
                  <th className="p-2 border">Total</th>
                  <th className="p-2 border">%</th>
                  <th className="p-2 border">Eligible?</th>
                </tr>
              </thead>

              <tbody>
                {records.map((r, i) => (
                  <tr key={r._id}>
                    <td className="p-2 border text-center">{i + 1}</td>

                    <td className="p-2 border text-center">
                      {r.studentId?.registerNumber || "-"}
                    </td>

                    <td className="p-2 border">{r.studentId?.name || "-"}</td>

                    <td className="p-2 border text-center">{r.presentHours}</td>

                    <td className="p-2 border text-center">{r.totalHours}</td>

                    <td className="p-2 border text-center">
                      {r.percentage ? r.percentage.toFixed(1) : 0}
                    </td>

                    <td
                      className="p-2 border text-center font-bold"
                      style={{
                        color: r.percentage >= 75 ? "green" : "red",
                      }}
                    >
                      {r.percentage >= 75 ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DOWNLOAD BUTTONS */}
      {records.length > 0 && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={downloadEligible}
            className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <Download className="w-5 h-5" /> Download Eligible
          </button>

          <button
            onClick={downloadNonEligible}
            className="bg-red-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <Download className="w-5 h-5" /> Download Not Eligible
          </button>
        </div>
      )}

      {selected && !loadingRecords && records.length === 0 && (
        <p className="text-gray-500 mt-4">
          No attendance records available for this subject.
        </p>
      )}
    </div>
  );
}
