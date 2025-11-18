"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export default function HODManageAllocations() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const department = user?.publicMetadata?.department;

  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState([]);

  // ---------------------------------------------------------
  // Load all allocations for HOD department
  // ---------------------------------------------------------
  const loadAllocations = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subject-allocations/hod?department=${department}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(res.data);
      setAllocations(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch allocations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllocations();
  }, []);

  // ---------------------------------------------------------
  // Enable Edit for One Row
  // ---------------------------------------------------------
  const startEdit = (alloc) => {
    setEditId(alloc._id);
    setEditData(
      alloc.staff.map((s) => ({
        staffId: s.staffId?._id,
        portions: s.portions || "",
      }))
    );
  };

  // ---------------------------------------------------------
  // Save Edited Allocation
  // ---------------------------------------------------------
  const saveEdit = async (id) => {
    try {
      const token = await getToken();

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subject-allocations/${id}`,
        { staff: editData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Allocation updated");
      setEditId(null);
      loadAllocations();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update allocation");
    }
  };

  // ---------------------------------------------------------
  // Delete Allocation
  // ---------------------------------------------------------
  const deleteAllocation = async (id) => {
    if (!confirm("Delete this subject allocation?")) return;

    try {
      const token = await getToken();

      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subject-allocations/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Allocation deleted");
      loadAllocations();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete allocation");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manage Subject Allocations</h1>

      {loading && <p>Loading...</p>}

      {!loading && allocations.length === 0 && (
        <p className="text-gray-600">No allocations found.</p>
      )}

      {!loading && allocations.length > 0 && (
        <div className="overflow-x-auto shadow rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2">Sl. No</th>
                <th className="border p-2">Photo</th>
                <th className="border p-2">Faculty Name</th>
                <th className="border p-2">Subject</th>
                <th className="border p-2">Semester</th>
                <th className="border p-2">Section</th>
                <th className="border p-2">Portions</th>
                <th className="border p-2 w-40">Actions</th>
              </tr>
            </thead>

            <tbody>
              {allocations.map((alloc, i) =>
                alloc.staff.map((staffItem, idx) => {
                  const isEditing = editId === alloc._id;

                  return (
                    <tr key={staffItem._id || idx} className="bg-white">
                      {/* Sl No */}
                      <td className="border p-2 text-center">{i + 1}</td>

                      {/* Faculty Photo */}
                      <td className="border p-2 text-center">
                        {staffItem.staffId?.imageUrl ? (
                          <img
                            src={staffItem.staffId.imageUrl}
                            className="w-10 h-10 rounded-full object-cover mx-auto"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300 mx-auto" />
                        )}
                      </td>

                      {/* Faculty Name */}
                      <td className="border p-2 font-medium">
                        {staffItem.staffId?.name}
                      </td>

                      {/* Subject */}
                      <td className="border p-2">
                        {alloc.subject.code} – {alloc.subject.name}
                      </td>

                      {/* Semester */}
                      <td className="border p-2 text-center">
                        {alloc.semester}
                      </td>

                      {/* Section */}
                      <td className="border p-2 text-center">
                        {alloc.section}
                      </td>

                      {/* Portions */}
                      <td className="border p-2">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData[idx]?.portions || ""}
                            onChange={(e) => {
                              const updated = [...editData];
                              updated[idx].portions = e.target.value;
                              setEditData(updated);
                            }}
                            className="border p-1 rounded w-full"
                          />
                        ) : (
                          staffItem.portions || (
                            <span className="text-gray-500">Not Assigned</span>
                          )
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="border p-2 text-center">
                        {!isEditing ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => startEdit(alloc)}
                              className="px-2 py-1 bg-blue-600 text-white rounded"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteAllocation(alloc._id)}
                              className="px-2 py-1 bg-red-600 text-white rounded"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => saveEdit(alloc._id)}
                              className="px-2 py-1 bg-green-600 text-white rounded"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              className="px-2 py-1 bg-gray-600 text-white rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
