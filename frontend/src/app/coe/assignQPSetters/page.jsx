"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import Swal from "sweetalert2";
import QPSettersTable from "./QPSettersTable";

export default function AssignQPs() {
  const { getToken } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [setterId, setSetterId] = useState("");
  const [examType, setExamType] = useState("SEE");
  const [attempt, setAttempt] = useState(1);

  useEffect(() => {
    fetchSubjects();
    fetchStaff();
  }, []);

  const fetchSubjects = async () => {
    const token = await getToken();
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subjects/getsubjects`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubjects(res.data.data);
    } catch (err) {
      Swal.fire("Error", "Failed to fetch subjects", "error");
    }
  };

  const fetchStaff = async () => {
    const token = await getToken();
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/getusers?role=Staff`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStaffList(res.data.data);
    } catch (err) {
      Swal.fire("Error", "Failed to fetch staff", "error");
    }
  };

  const assignQP = async () => {
    if (!subjectId || !setterId) {
      return Swal.fire(
        "Missing Data",
        "Please select subject & setter",
        "warning"
      );
    }

    const token = await getToken();

    // 🔹 SHOW LOADING
    Swal.fire({
      title: "Assigning...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/qps/assign`,
        { subjectId, setterId, examType, attempt },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Success!", "Question Paper assigned successfully!", "success");

      // Reset selection (optional)
      setSubjectId("");
      setSetterId("");
      setAttempt(1);
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Failed to assign",
        "error"
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Assign Question Paper Setter</h1>

      <div className="bg-white shadow p-6 rounded-lg space-y-5">
        {/* SUBJECT */}
        <label className="block">
          <span className="font-medium">Select Subject</span>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="border rounded p-2 w-full mt-1"
          >
            <option value="">-- Select --</option>
            {subjects.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.code} - {sub.name} (Sem {sub.semester})
              </option>
            ))}
          </select>
        </label>

        {/* SETTER */}
        <label className="block">
          <span className="font-medium">Select Setter</span>
          <select
            value={setterId}
            onChange={(e) => setSetterId(e.target.value)}
            className="border rounded p-2 w-full mt-1"
          >
            <option value="">-- Select --</option>
            {staffList.map((st) => (
              <option key={st._id} value={st._id}>
                {st.name} ({st.department})
              </option>
            ))}
          </select>
        </label>

        {/* OPTIONS */}
        <div className="flex gap-4">
          <label className="block w-1/2">
            <span className="font-medium">Exam Type</span>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="border p-2 rounded w-full mt-1"
            >
              <option value="SEE">SEE</option>
              <option value="IA1">IA1</option>
              <option value="IA2">IA2</option>
              <option value="IA3">IA3</option>
            </select>
          </label>

          <label className="block w-1/2">
            <span className="font-medium">Attempt</span>
            <input
              type="number"
              value={attempt}
              onChange={(e) => setAttempt(e.target.value)}
              className="border p-2 rounded w-full mt-1"
            />
          </label>
        </div>

        <button
          onClick={assignQP}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 transition"
        >
          Assign Setter
        </button>
      </div>

      {/* TABLE BELOW */}
      <QPSettersTable />
    </div>
  );
}
