"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { toast } from "sonner";
import { Eye, Trash2, ArrowUpDown } from "lucide-react";
import Modal from "./Modal";

export default function HodApprovalPage() {
  const { getToken } = useAuth();

  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination
  const pageSize = 5;
  const [page, setPage] = useState(1);

  // Fetch Requests
  const fetchRequests = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/edit-requests/pending`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRequests(res.data.data);
      setFiltered(res.data.data);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // SEARCH FILTER
  useEffect(() => {
    let data = [...requests];

    if (search.trim() !== "") {
      const s = search.toLowerCase();
      data = data.filter(
        (req) =>
          req.studentId.name.toLowerCase().includes(s) ||
          (req.studentId.registerNumber || "").toLowerCase().includes(s) ||
          req.studentId.currentDepartment.toLowerCase().includes(s)
      );
    }

    // SORT
    data.sort((a, b) => {
      let v1 = a.studentId[sortField] || "";
      let v2 = b.studentId[sortField] || "";

      if (typeof v1 === "string") v1 = v1.toLowerCase();
      if (typeof v2 === "string") v2 = v2.toLowerCase();

      if (sortOrder === "asc") return v1 > v2 ? 1 : -1;
      return v1 < v2 ? 1 : -1;
    });

    setFiltered(data);
    setPage(1);
  }, [search, sortField, sortOrder, requests]);

  // Approve/Reject Action
  const handleAction = async (requestId, action) => {
    let remarks = "";

    if (action === "REJECTED") {
      remarks = prompt("Enter rejection reason:");
      if (!remarks) return;
    }

    setActionLoading(true);

    try {
      const token = await getToken();
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/edit-request/${requestId}`,
        { action, remarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Request ${action.toLowerCase()} successfully`);
      setSelectedRequest(null);
      fetchRequests();
    } catch {
      toast.error("Failed to process request");
    } finally {
      setActionLoading(false);
    }
  };

  // DELETE REQUEST
  const deleteRequest = async (id) => {
    if (!confirm("Delete this request permanently?")) return;

    try {
      const token = await getToken();
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/edit-request/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Request deleted");
      fetchRequests();
    } catch {
      toast.error("Failed to delete");
    }
  };

  // Pagination Data
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Approval Requests</h1>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          placeholder="Search name, reg no, department..."
          className="border px-3 py-2 rounded w-full sm:w-1/2"
          onChange={(e) => setSearch(e.target.value)}
        />

        <div
          className="flex items-center gap-2 cursor-pointer border px-3 py-2 rounded w-full sm:w-1/3"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          <ArrowUpDown className="w-4 h-4" />
          Sort: {sortField.toUpperCase()} ({sortOrder})
        </div>

        <select
          className="border px-3 py-2 rounded w-full sm:w-1/3"
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
        >
          <option value="name">Name</option>
          <option value="registerNumber">Register No</option>
          <option value="currentDepartment">Department</option>
        </select>
      </div>

      {/* Requests Table */}
      <table className="w-full border rounded shadow-sm text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Sl No</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Register No</th>
            <th className="p-2 border">Department</th>
            <th className="p-2 border">Action</th>
            <th className="p-2 border">Delete</th>
          </tr>
        </thead>
        <tbody>
          {paginated.length === 0 && (
            <tr>
              <td className="p-4 text-center text-gray-500" colSpan={5}>
                No matching results
              </td>
            </tr>
          )}

          {paginated.map((req, index) => (
            <tr key={req._id} className="border-t">
              <td className="p-2 border">{index + 1}</td>
              <td className="p-2 border">{req.studentId.name}</td>
              <td className="p-2 border">
                {req.studentId.registerNumber || "-"}
              </td>
              <td className="p-2 border">{req.studentId.currentDepartment}</td>

              <td className="p-2 border">
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded flex items-center gap-1"
                  onClick={() => setSelectedRequest(req)}
                >
                  <Eye className="w-4 h-4" /> View
                </button>
              </td>

              <td className="p-2 border">
                <button
                  className="px-3 py-1 bg-red-600 text-white rounded flex items-center gap-1"
                  onClick={() => deleteRequest(req._id)}
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-3 mt-4">
        <button
          disabled={page === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => setPage(page - 1)}
        >
          Prev
        </button>

        <span>
          Page {page} of {totalPages || 1}
        </span>

        <button
          disabled={page === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>

      {/* MODAL */}
      {selectedRequest && (
        <Modal onClose={() => setSelectedRequest(null)}>
          <EditRequestModalContent
            request={selectedRequest}
            actionLoading={actionLoading}
            handleAction={handleAction}
          />
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------
   MODAL CONTENT (Separated for clean structure)
----------------------------------------------*/
function EditRequestModalContent({ request, actionLoading, handleAction }) {
  return (
    <>
      <h2 className="text-lg font-bold mb-4">
        {request.studentId.name} – Requested Changes
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {request.requestedChanges.imageUrl && (
          <div className="col-span-2 flex justify-between gap-4 p-3 bg-gray-50 border rounded">
            <div>
              <p className="text-xs text-gray-500">OLD IMAGE</p>
              <img
                src={request.studentId.imageUrl}
                className="w-28 h-28 object-cover rounded border"
              />
            </div>

            <div>
              <p className="text-xs text-gray-500">NEW IMAGE</p>
              <img
                src={request.requestedChanges.imageUrl}
                className="w-28 h-28 object-cover rounded border"
              />
            </div>
          </div>
        )}

        {Object.entries(request.requestedChanges).map(([key, newVal]) => {
          if (key === "imageUrl") return null;

          const oldVal = request.studentId[key];
          const changed = oldVal !== newVal;

          return (
            <div
              key={key}
              className={`p-3 rounded ${
                changed
                  ? "bg-yellow-50 border border-yellow-300"
                  : "bg-gray-50 border"
              }`}
            >
              <p className="text-xs text-gray-500 uppercase">
                {key.replace(/([A-Z])/g, " $1")}
              </p>

              <p className="text-sm">
                <span className="text-gray-600">Old:</span> {oldVal || "-"}
              </p>
              <p className="text-sm">
                <span className="text-gray-600">New:</span> {newVal || "-"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Approve / Reject */}
      <div className="flex gap-3">
        <button
          disabled={actionLoading}
          onClick={() => handleAction(request._id, "APPROVE")}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Approve
        </button>

        <button
          disabled={actionLoading}
          onClick={() => handleAction(request._id, "REJECTED")}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Reject
        </button>
      </div>
    </>
  );
}
