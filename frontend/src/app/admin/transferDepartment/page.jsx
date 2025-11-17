"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

const DEPARTMENTS = ["CS", "ME", "EC", "EEE", "CE", "CH", "AT", "PO", "SC"];

export default function TransferDepartmentPage() {
  const { getToken } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(null);
  const [search, setSearch] = useState("");

  const fetchRegisteredStudents = async () => {
    setLoading(true);
    const token = await getToken();

    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/regnum/registered`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudents(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Error loading students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegisteredStudents();
  }, []);

  // Transfer Department
  const handleTransfer = async (studentId, newDept) => {
    if (!newDept) return;

    setTransferLoading(studentId);
    const token = await getToken();

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/regnum/transfer`,
        { studentId, newDepartment: newDept },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchRegisteredStudents();
      alert("Department transferred successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Error during transfer");
    } finally {
      setTransferLoading(null);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.registerNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Transfer Student Department</h1>

      {/* Search Box */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or reg number..."
          className="border p-2 rounded w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden shadow">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 text-sm">
            <tr>
              <th className="p-3 border">Name</th>
              <th className="p-3 border">Current Dept</th>
              <th className="p-3 border">Register No</th>
              <th className="p-3 border">Admission Type</th>
              <th className="p-3 border">Change To</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="p-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-500">
                  No students found.
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr key={s._id} className="border-b text-center">
                  <td className="p-3 border">{s.name}</td>
                  <td className="p-3 border font-semibold">
                    {s.currentDepartment}
                  </td>
                  <td className="p-3 border text-blue-600">
                    {s.registerNumber}
                  </td>
                  <td className="p-3 border">{s.admissionType}</td>

                  {/* Transfer Selector */}
                  <td className="p-3 border">
                    <select
                      className="border p-1 rounded"
                      defaultValue=""
                      onChange={(e) => handleTransfer(s._id, e.target.value)}
                      disabled={transferLoading === s._id}
                    >
                      <option value="" disabled>
                        Select Dept
                      </option>
                      {DEPARTMENTS.filter((d) => d !== s.currentDepartment).map(
                        (dept) => (
                          <option value={dept} key={dept}>
                            {dept}
                          </option>
                        )
                      )}
                    </select>

                    {transferLoading === s._id && (
                      <p className="text-xs text-gray-500 mt-1">Updating...</p>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
