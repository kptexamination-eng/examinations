"use client";

import { useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

export default function COEFeeDashboard() {
  const { getToken } = useAuth();
  const [semester, setSemester] = useState(1);
  const [summary, setSummary] = useState([]);

  const loadSummary = async () => {
    const token = await getToken();
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/fees/summary?semester=${semester}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setSummary(res.data);
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">COE – Fee Summary</h1>

      <select
        value={semester}
        onChange={(e) => setSemester(e.target.value)}
        className="border p-2"
      >
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <option key={s} value={s}>
            Semester {s}
          </option>
        ))}
      </select>

      <button
        onClick={loadSummary}
        className="ml-3 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Load
      </button>

      <ul className="mt-4">
        {summary.map((s) => (
          <li key={s._id}>
            {s._id ? "Paid" : "Not Paid"} : {s.count}
          </li>
        ))}
      </ul>
    </div>
  );
}
