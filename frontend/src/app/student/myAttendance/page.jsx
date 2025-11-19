"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

export default function StudentAttendanceView() {
  const { getToken } = useAuth();

  const [records, setRecords] = useState([]);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/student/my`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecords(res.data);
    })();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">My Attendance</h1>

      <table className="w-full text-sm border">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">Subject</th>
            <th className="border p-2">Present</th>
            <th className="border p-2">Total</th>
            <th className="border p-2">%</th>
            <th className="border p-2">Eligibility</th>
          </tr>
        </thead>

        <tbody>
          {records.map((r) => (
            <tr key={r.allocationId}>
              <td className="p-2 border">
                {r.subject.code} - {r.subject.name}
              </td>
              <td className="p-2 border">{r.presentHours ?? "-"}</td>
              <td className="p-2 border">{r.totalHours ?? "-"}</td>
              <td className="p-2 border">
                {r.total ? r.percentage.toFixed(1) : "-"}
              </td>
              <td className="p-2 border">
                {r.status === "Approved"
                  ? r.percentage >= 75
                    ? "Eligible"
                    : "Not Eligible"
                  : r.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
