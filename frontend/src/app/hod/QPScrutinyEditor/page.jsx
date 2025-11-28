"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import Swal from "sweetalert2";
import ScrutinyEditor from "./ScrutinyEditor";

export default function ScrutinyDashboard() {
  const { getToken } = useAuth();

  const [qps, setQps] = useState([]);
  const [selectedQP, setSelectedQP] = useState(null);

  useEffect(() => {
    loadQPs();
  }, []);

  const loadQPs = async () => {
    const token = await getToken();
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/qps/scrutiny/my-qps`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQps(res.data);
    } catch (err) {
      Swal.fire("Error", "Failed to load scrutiny papers", "error");
    }
  };

  // Show list
  if (!selectedQP) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">
          📌 QPs Assigned for Scrutiny
        </h1>

        {qps.length === 0 && (
          <p className="text-gray-500">No papers assigned yet.</p>
        )}

        <ul className="space-y-3">
          {qps.map((qp) => (
            <li
              key={qp._id}
              className="p-4 bg-white border rounded shadow cursor-pointer hover:bg-blue-50"
              onClick={() => setSelectedQP(qp)}
            >
              <p className="font-semibold">
                {qp.subject?.code} — {qp.subject?.name}
              </p>
              <p className="text-sm text-gray-600">
                {qp.examType} | Sem {qp.semester}
              </p>
              <p className="text-xs text-purple-600">Status: {qp.status}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (qp.status !== "UnderScrutiny") {
    return <div>❌ This QP is no longer editable.</div>;
  }

  // Open editor
  return <ScrutinyEditor qp={selectedQP} goBack={() => setSelectedQP(null)} />;
}
