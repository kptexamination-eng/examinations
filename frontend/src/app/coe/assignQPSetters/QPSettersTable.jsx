"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import Swal from "sweetalert2";

export default function QPSettersTable() {
  const { getToken } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState([]);
  const [selectedQP, setSelectedQP] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchScrutinyStaff = async () => {
    const token = await getToken();
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/users/getusers?role=HOD`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setStaffList(res.data.data);
  };
  const assignScrutiny = async (item) => {
    await fetchScrutinyStaff();

    const options = staffList
      .map(
        (st) =>
          `<option value="${st._id}">${st.name} (${st.department})</option>`
      )
      .join("");

    const { value: scrutinyStaffId } = await Swal.fire({
      title: "Assign Scrutiny Staff",
      html: `
      <select id="scrutinySelect" class="swal2-input">
        ${options}
      </select>
    `,
      confirmButtonText: "Assign",
      showCancelButton: true,
      preConfirm: () => document.getElementById("scrutinySelect").value,
    });

    if (!scrutinyStaffId) return;

    const token = await getToken();
    Swal.fire({ title: "Assigning...", didOpen: () => Swal.showLoading() });

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/qps/${item._id}/send-to-scrutiny`,
        { scrutinyStaffId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Assigned!", "Sent to scrutiny successfully", "success");
      fetchAssignments();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed", "error");
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    const token = await getToken();

    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/qps/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignments(res.data);
    } catch (err) {
      Swal.fire("Error", "Failed to load assignments", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteQP = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete this assignment!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, Delete",
    });

    if (!confirm.isConfirmed) return;

    const token = await getToken();
    Swal.fire({
      title: "Deleting...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/qps/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire("Deleted!", "Assignment removed successfully", "success");
      fetchAssignments();
    } catch (err) {
      Swal.fire("Error", "Failed to delete", "error");
    }
  };

  return (
    <div className="bg-white shadow p-6 rounded-lg mt-10">
      <h2 className="text-xl font-semibold mb-4">Assigned Question Papers</h2>

      {/* SHOW LOADING */}
      {loading && (
        <div className="text-center py-6 text-gray-500 animate-pulse">
          Loading assignments...
        </div>
      )}

      {/* TABLE */}
      {!loading && (
        <table className="w-full border-collapse text-sm rounded-md overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-blue-100 text-left">
              <th className="border p-3">SL No</th>
              <th className="border p-3">Subject</th>
              <th className="border p-3">Setter</th>
              <th className="border p-3">Dept</th>
              <th className="border p-3">Status</th>
              <th className="border p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {assignments.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center p-4 text-gray-500">
                  No assignments found
                </td>
              </tr>
            )}

            {assignments.map((item, index) => (
              <tr
                key={item._id}
                className="border-b hover:bg-gray-50 transition duration-150"
              >
                <td className="border p-3">{index + 1}</td>

                <td className="border p-3 font-medium">
                  {item.subject?.code} - {item.subject?.name}
                </td>

                <td className="border p-3">{item.setter?.name}</td>

                <td className="border p-3">{item.department}</td>

                <td
                  className={`border p-3 font-semibold ${
                    item.status === "Assigned"
                      ? "text-purple-600"
                      : item.status === "UnderScrutiny"
                      ? "text-blue-600"
                      : item.status === "ApprovedLocked"
                      ? "text-green-600"
                      : "text-gray-600"
                  }`}
                >
                  {item.status}
                </td>

                <td className="border p-3 text-center space-x-2">
                  <button className="bg-yellow-500 text-white px-3 py-1 rounded text-xs hover:opacity-80">
                    Edit
                  </button>
                  {item.status === "SubmittedToCOE" && (
                    <button
                      onClick={() => assignScrutiny(item)}
                      className="bg-purple-700 text-white px-3 py-1 rounded text-xs hover:opacity-80"
                    >
                      Assign Scrutiny
                    </button>
                  )}
                  <button
                    onClick={() => deleteQP(item._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:opacity-80"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
