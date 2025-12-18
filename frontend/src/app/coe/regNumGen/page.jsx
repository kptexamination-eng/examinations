"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import Swal from "sweetalert2";

export default function RegisterNumberGenerator() {
  const { getToken } = useAuth();

  const [pending, setPending] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

  // -------------------------------------------
  // Fetch pending students
  // -------------------------------------------
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

  // -------------------------------------------
  // FILTERING
  // -------------------------------------------
  useEffect(() => {
    let data = [...pending];

    if (departmentFilter !== "ALL") {
      data = data.filter(
        (s) => s.currentDepartment.toUpperCase() === departmentFilter
      );
    }

    setFiltered(data);
  }, [pending, departmentFilter]);

  // -------------------------------------------
  // Single generation
  // -------------------------------------------
  const generateForOne = async (id) => {
    setLoadingId(id);

    Swal.fire({
      title: "Generating Register Number...",
      html: "Please wait",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const token = await getToken();

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/regnum/generate`,
        { studentId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.close();
      Swal.fire("Success!", "Register number generated.", "success");

      await fetchPending();
    } catch (err) {
      Swal.close();
      Swal.fire("Error", err.response?.data?.message || "Failed!", "error");
    } finally {
      setLoadingId(null);
    }
  };

  // -------------------------------------------
  // Bulk generation
  // -------------------------------------------
  const generateBulk = async () => {
    setBulkLoading(true);

    Swal.fire({
      title: "Generating Register Numbers...",
      html: "Please wait while bulk generation is happening.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const token = await getToken();

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/regnum/generate-bulk`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.close();
      Swal.fire("Completed!", "Bulk register numbers generated.", "success");

      await fetchPending();
    } catch (err) {
      Swal.close();
      Swal.fire("Error", err.response?.data?.message || "Failed!", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  // -------------------------------------------
  // UI
  // -------------------------------------------
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Register Number Generation</h1>

      {/* FILTER + BULK BUTTON */}
      <div className="flex justify-between items-center mb-4">
        {/* Department Filter */}
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="border px-3 py-2 rounded shadow"
        >
          <option value="ALL">All Departments</option>
          <option value="CS">CS</option>
          <option value="EC">EC</option>
          <option value="EEE">EEE</option>
          <option value="ME">ME</option>
          <option value="CE">CE</option>
          <option value="CH">CH</option>
          <option value="AT">AT</option>
          <option value="PO">PO</option>
          <option value="OT">OT</option>
          <option value="SC">SC</option>
        </select>

        <button
          onClick={generateBulk}
          disabled={bulkLoading || filtered.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow disabled:bg-gray-400"
        >
          {bulkLoading ? "Generating..." : "Generate All"}
        </button>
      </div>

      <p className="text-gray-700 font-medium mb-2">
        Showing: <b>{filtered.length}</b> pending students
      </p>

      {/* TABLE */}
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
            {filtered.map((s) => (
              <tr key={s._id} className="text-center border-b">
                <td className="p-3 border">{s.name}</td>
                <td className="p-3 border">{s.currentDepartment}</td>
                <td className="p-3 border">{s.admissionType}</td>
                <td className="p-3 border">{s.admissionYear}</td>

                <td className="p-3 border">
                  <button
                    onClick={() => generateForOne(s._id)}
                    disabled={loadingId === s._id}
                    className="px-3 py-1 bg-green-600 text-white rounded disabled:bg-gray-400"
                  >
                    {loadingId === s._id ? "Processing..." : "Generate"}
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="p-6 text-gray-500 text-center">
                  🎉 No pending students!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
