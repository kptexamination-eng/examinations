"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

export default function OfficeFeeDashboard() {
  const { getToken } = useAuth();

  const [semester, setSemester] = useState(1);
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");

  const loadStudents = async () => {
    const token = await getToken();

    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/students/getstudents?semester=${semester}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setStudents(res.data.data || []);
  };

  const payFee = async () => {
    const token = await getToken();

    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/fees/pay/${selected.studentId}`,
      {
        semester,
        amountPaid: Number(amount),
        paymentMode: "CASH",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert("Payment successful");
    setSelected(null);
    setAmount("");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Office Fee Dashboard</h1>

      <div className="flex gap-4 mb-4">
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
          onClick={loadStudents}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Load Students
        </button>
      </div>

      <table className="w-full border text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">USN</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Pay</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s._id}>
              <td className="border p-2">{s.registerNumber}</td>
              <td className="border p-2">{s.name}</td>
              <td className="border p-2">{s.isPaid ? "Paid" : "Not Paid"}</td>
              <td className="border p-2">
                <button
                  onClick={() => setSelected(s)}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Pay
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-80">
            <h2 className="font-bold mb-2">Pay Exam Fee</h2>

            <input
              type="number"
              placeholder="Amount"
              className="border p-2 w-full mb-3"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <div className="flex justify-between">
              <button
                onClick={() => setSelected(null)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={payFee}
                className="bg-blue-600 text-white px-4 py-1 rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
