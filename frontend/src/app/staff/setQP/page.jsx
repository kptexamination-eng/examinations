"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import QPEditor from "./QPEditor";
import Swal from "sweetalert2";

export default function SetQPPage() {
  const { getToken } = useAuth();
  const [qps, setQps] = useState([]);
  const [selectedQP, setSelectedQP] = useState(null);

  useEffect(() => {
    loadQPs();
  }, []);

  const loadQPs = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/qps/my-qps`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQps(res.data);
    } catch (err) {
      Swal.fire("Error", "Failed to fetch assigned QPs", "error");
    }
  };

  if (!selectedQP) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">
          📚 My Assigned Question Papers
        </h1>

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
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return <QPEditor qp={selectedQP} goBack={() => setSelectedQP(null)} />;
}
