"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import Swal from "sweetalert2";
import LockedQPViewer from "./LockedQPViewer";

export default function LockedQPList() {
  const { getToken } = useAuth();
  const [qps, setQps] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const token = await getToken();
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/qps/locked`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setQps(res.data);
  };

  if (selected) {
    return <LockedQPViewer qp={selected} goBack={() => setSelected(null)} />;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-blue-700">
        🔒 Locked Question Papers (Final)
      </h1>

      <table className="w-full border text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2 border">Subject</th>
            <th className="p-2 border">Setter</th>
            <th className="p-2 border">Scrutiny</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border text-center">View</th>
          </tr>
        </thead>

        <tbody>
          {qps.map((q) => (
            <tr key={q._id}>
              <td className="border p-2">
                {q.subject?.code} - {q.subject?.name}
              </td>
              <td className="border p-2">{q.setter?.name}</td>
              <td className="border p-2">{q.scrutinyStaff?.name || "—"}</td>
              <td className="border p-2 text-purple-600">{q.status}</td>
              <td className="border p-2 text-center">
                <button
                  onClick={() => setSelected(q)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
                >
                  View Paper
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
