"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

export default function RegisterNumberGenerator() {
  const { getToken } = useAuth();

  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchPending = async () => {
    const token = await getToken();
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/regnum/pending`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setPending(res.data);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const generateForOne = async (id) => {
    setLoading(id);
    const token = await getToken();

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/regnum/generate`,
        { studentId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchPending();
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const generateBulk = async () => {
    setBulkLoading(true);

    const token = await getToken();
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/regnum/generate-bulk`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchPending();
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Register Number Generation</h1>

      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-700 font-medium">
          Pending Students: {pending.length}
        </p>

        <button
          onClick={generateBulk}
          disabled={bulkLoading || pending.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow disabled:bg-gray-400"
        >
          {bulkLoading ? "Generating..." : "Generate All"}
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden shadow">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 text-sm">
            <tr>
              <th className="p-3 border">Name</th>
              <th className="p-3 border">Department</th>
              <th className="p-3 border">Admission Type</th>
              <th className="p-3 border">Year</th>
              <th className="p-3 border">Action</th>
            </tr>
          </thead>

          <tbody>
            {pending.map((s) => (
              <tr key={s._id} className="text-center border-b">
                <td className="p-3 border">{s.name}</td>
                <td className="p-3 border">{s.currentDepartment}</td>
                <td className="p-3 border">{s.admissionType}</td>
                <td className="p-3 border">{s.admissionYear}</td>

                <td className="p-3 border">
                  <button
                    onClick={() => generateForOne(s._id)}
                    disabled={loading === s._id}
                    className="px-3 py-1 bg-green-600 text-white rounded disabled:bg-gray-400"
                  >
                    {loading === s._id ? "Processing..." : "Generate"}
                  </button>
                </td>
              </tr>
            ))}

            {pending.length === 0 && (
              <tr>
                <td colSpan="5" className="p-6 text-gray-500">
                  🎉 All students have register numbers!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
