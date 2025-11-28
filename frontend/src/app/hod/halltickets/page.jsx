"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";

export default function HallTicketPrinter() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const department = user?.publicMetadata?.department; // HOD dept

  const [semester, setSemester] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [examType, setExamType] = useState("NOV2025");
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);

  // Fetch students filtered by department + semester
  const loadStudents = async (sem) => {
    setFetchingStudents(true);
    setStudents([]);
    setSelectedStudent("");

    try {
      const token = await getToken();

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/getstudents`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(res.data);
      const filtered = res.data.data.filter(
        (s) =>
          s?.currentDepartment?.toLowerCase() === department?.toLowerCase() &&
          Number(s?.semester) === Number(sem)
      );

      setStudents(filtered);
    } catch (err) {
      console.error(err);
      alert("Failed to load students!");
    }
    setFetchingStudents(false);
  };

  const handlePrint = () => {
    if (!selectedStudent) {
      alert("Select a student");
      return;
    }
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/halltickets/print/${selectedStudent}?examType=${examType}`;

    // window.open(url, "_blank");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded mt-8">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">
        🎓 HOD – Print Hall Ticket
      </h1>

      {/* SEMESTER */}
      <div className="mb-4">
        <label className="font-semibold">Select Semester:</label>
        <select
          className="w-full border p-2 rounded mt-1"
          value={semester}
          onChange={(e) => {
            setSemester(e.target.value);
            loadStudents(e.target.value);
          }}
        >
          <option value="">-- Select Semester --</option>
          {[1, 2, 3, 4, 5, 6].map((sem) => (
            <option key={sem} value={sem}>
              Semester {sem}
            </option>
          ))}
        </select>
      </div>

      {/* STUDENT LIST */}
      <div className="mb-4">
        <label className="font-semibold">Select Student:</label>
        <select
          disabled={fetchingStudents || semester === ""}
          className="w-full border p-2 rounded mt-1"
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
        >
          <option value="">
            {fetchingStudents
              ? "Loading students..."
              : semester === ""
              ? "Select semester first"
              : students.length === 0
              ? "No students found"
              : "-- Select Student --"}
          </option>
          {students.map((std) => (
            <option key={std._id} value={std._id}>
              {std.usn} — {std.name}
            </option>
          ))}
        </select>
      </div>

      {/* EXAM TYPE */}
      <div className="mb-4">
        <label className="font-semibold">Exam Type:</label>
        <select
          value={examType}
          onChange={(e) => setExamType(e.target.value)}
          className="w-full border p-2 rounded mt-1"
        >
          <option value="NOV2025">NOV/DEC 2025</option>
          <option value="MAY2025">MAY/JUNE 2025</option>
          <option value="C20">C20 Scheme</option>
        </select>
      </div>

      {/* PRINT */}
      <button
        onClick={handlePrint}
        disabled={!selectedStudent || loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 transition w-full font-medium"
      >
        {loading ? "Generating..." : "🖨️ Print Hall Ticket"}
      </button>
    </div>
  );
}
