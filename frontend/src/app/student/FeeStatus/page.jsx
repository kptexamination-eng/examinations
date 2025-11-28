"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

export default function StudentFeeStatus() {
  const { getToken } = useAuth();
  const [fees, setFees] = useState([]);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/fees/student/my`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFees(res.data);
    })();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">My Fee Status</h1>

      {fees.length > 0 ? (
        <table className="w-full border text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">Semester</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Paid</th>
              <th className="p-2 border">Balance</th>
              <th className="p-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((f) => (
              <tr key={f._id}>
                <td className="p-2 border">{f.semester}</td>
                <td className="p-2 border">{f.amount}</td>
                <td className="p-2 border">{f.paidAmount}</td>
                <td className="p-2 border">{f.balance}</td>
                <td className="p-2 border">
                  {f.isPaid ? "✔ Paid" : "❌ Not Paid"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No fee records found.</p>
      )}
    </div>
  );
}
