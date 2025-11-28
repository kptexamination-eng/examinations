"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

export default function OfficeFeeDashboard() {
  const { getToken } = useAuth();

  const [department, setDepartment] = useState("CS");
  const [semester, setSemester] = useState(1);
  const [section, setSection] = useState("");

  const [students, setStudents] = useState([]);
  const [feeStatus, setFeeStatus] = useState({}); // { studentId: "Paid" }

  const loadStudents = async () => {
    const token = await getToken();

    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/students/getstudents?department=${department}&semester=${semester}&section=${section}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const list = res.data.data || [];

    setStudents(list);

    const statusObj = {};
    list.forEach((stu) => {
      statusObj[stu._id] = "Not Paid"; // default
    });

    setFeeStatus(statusObj);
  };

  const updateFee = async (studentId) => {
    const token = await getToken();

    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/fees/update`,
      {
        studentId,
        semester,
        status: feeStatus[studentId],
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert("Fee updated!");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Office Fee Entry</h1>

      {/* FILTERS */}
      <div className="flex gap-4 mb-4">
        <select
          className="border p-2"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="CS">CS</option>
          <option value="ME">ME</option>
          <option value="EC">EC</option>
          <option value="EEE">EEE</option>
        </select>

        <select
          className="border p-2"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <option key={s} value={s}>
              Sem {s}
            </option>
          ))}
        </select>

        <input
          placeholder="Section"
          className="border p-2"
          value={section}
          onChange={(e) => setSection(e.target.value)}
        />

        <button
          onClick={loadStudents}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Load Students
        </button>
      </div>

      {/* STUDENT LIST */}
      {students.length > 0 && (
        <table className="w-full border text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="border p-2">Photo</th>
              <th className="border p-2">USN</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Phone</th>
              <th className="border p-2">Semester</th>
              <th className="border p-2">Fee Status</th>
              <th className="border p-2">Update</th>
            </tr>
          </thead>

          <tbody>
            {students.map((stu) => (
              <tr key={stu._id}>
                <td className="border p-2">
                  <img
                    src={stu.imageUrl}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </td>

                <td className="border p-2">{stu.registerNumber}</td>
                <td className="border p-2">{stu.name}</td>
                <td className="border p-2">{stu.phone}</td>
                <td className="border p-2">{stu.semester}</td>

                <td className="border p-2">
                  <select
                    className="border p-2"
                    value={feeStatus[stu._id]}
                    onChange={(e) =>
                      setFeeStatus((prev) => ({
                        ...prev,
                        [stu._id]: e.target.value,
                      }))
                    }
                  >
                    <option value="Paid">Paid</option>
                    <option value="Not Paid">Not Paid</option>
                  </select>
                </td>

                <td className="border p-2">
                  <button
                    onClick={() => updateFee(stu._id)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
