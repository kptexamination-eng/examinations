"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Search } from "lucide-react";
import LoaderOverlay from "../../components/LoaderOverlay";

const departments = [
  { value: "", label: "All Departments" },
  { value: "AT", label: "Automobile Engineering" },
  { value: "CH", label: "Chemical Engineering" },
  { value: "CE", label: "Civil Engineering" },
  { value: "CS", label: "Computer Science Engineering" },
  { value: "EC", label: "Electronics & Communication Engineering" },
  { value: "EEE", label: "Electrical & Electronics Engineering" },
  { value: "ME", label: "Mechanical Engineering" },
  { value: "PO", label: "Polymer Engineering" },
  { value: "SC", label: "Science and English" },
  { value: "EN", label: "General (Non-Department)" },
  { value: "OT", label: "Others" },
];

const roles = [
  "",
  "Admin",
  "Principal",
  "Registrar",
  "COE",
  "AssistantCOE",
  "ChairmanOfExams",
  "OfficeExam",
  "OfficeAdmissions",
  "OfficeFee",
  "HOD",
  "Staff",
  "MarkEntryCaseWorker",
  "Student",
];

export default function AdminStaffList() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterDept, setFilterDept] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [action, setAction] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    role: "",
  });

  // Fetch ALL members
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/getusers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // API returns { success, data }
      setUsers(res.data.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("❌ Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // FILTERING LOGIC
  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.toLowerCase().includes(search.toLowerCase());

    const matchRole = filterRole ? u.role === filterRole : true;
    const matchDept = filterDept ? u.department === filterDept : true;

    return matchSearch && matchRole && matchDept;
  });

  // Start Editing
  const startEditing = (u) => {
    setEditingId(u._id);
    setEditForm({
      name: u.name,
      email: u.email,
      phone: u.phone,
      department: u.department,
      role: u.role,
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      name: "",
      email: "",
      phone: "",
      department: "",
      role: "",
    });
  };

  // Update user
  const handleUpdate = async (id) => {
    try {
      setAction("updating");
      const token = await getToken();

      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/updateuser/${id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Updated successfully");
      setUsers(users.map((u) => (u._id === id ? res.data.data : u)));
      cancelEdit();
    } catch (err) {
      toast.error("Failed to update");
    } finally {
      setAction(null);
    }
  };

  // Delete user
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete?")) return;

    try {
      setAction("deleting");
      const token = await getToken();

      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/deleteuser/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers(users.filter((u) => u._id !== id));
      toast.success("Deleted successfully");
    } catch (err) {
      toast.error("Failed to delete");
    } finally {
      setAction(null);
    }
  };

  return (
    <div className="mt-10 relative">
      {action && (
        <LoaderOverlay
          message={action === "updating" ? "Updating..." : "Deleting..."}
        />
      )}

      <h2 className="text-2xl font-semibold mb-5">All Members</h2>

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-3 mb-5 md:items-center md:justify-between">
        {/* Search */}
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg"
          />
        </div>

        {/* Role Filter */}
        <select
          className="border px-3 py-2 rounded-lg"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">All Roles</option>
          {roles
            .filter((r) => r !== "")
            .map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
        </select>

        {/* Department Filter */}
        <select
          className="border px-3 py-2 rounded-lg"
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
        >
          {departments.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      {loading ? (
        <LoaderOverlay message="Loading users..." />
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No users found.</p>
      ) : (
        <table className="w-full border rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Sl. No</th>
              <th className="p-2">Image</th>
              <th className="p-2">Name</th>
              <th className="p-px">Email</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Dept</th>
              <th className="p-2">Role</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((u, i) => (
              <tr key={u._id} className="border-t">
                <td className="p-2 text-center">{i + 1}</td>

                <td className="p-2">
                  <img
                    src={u.imageUrl || "/default-avatar.png"}
                    className="w-10 h-10 rounded-full border object-cover"
                  />
                </td>

                {/* NAME */}
                <td className="p-2">
                  {editingId === u._id ? (
                    <input
                      name="name"
                      className="border px-2 py-1 rounded w-full"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                    />
                  ) : (
                    u.name
                  )}
                </td>

                {/* EMAIL */}
                <td className="p-2">
                  {editingId === u._id ? (
                    <input
                      name="email"
                      className="border px-2 py-1 rounded w-full"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                    />
                  ) : (
                    u.email
                  )}
                </td>

                {/* PHONE */}
                <td className="p-2">
                  {editingId === u._id ? (
                    <input
                      name="phone"
                      className="border px-2 py-1 rounded w-full"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                    />
                  ) : (
                    u.phone
                  )}
                </td>

                {/* DEPT */}
                <td className="p-2 uppercase">
                  {editingId === u._id ? (
                    <select
                      name="department"
                      className="border px-2 py-1 rounded w-full"
                      value={editForm.department}
                      onChange={(e) =>
                        setEditForm({ ...editForm, department: e.target.value })
                      }
                    >
                      {departments
                        .filter((d) => d.value !== "")
                        .map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                    </select>
                  ) : (
                    u.department
                  )}
                </td>

                {/* ROLE */}
                <td className="p-2">
                  {editingId === u._id ? (
                    <select
                      name="role"
                      className="border px-2 py-1 rounded w-full"
                      value={editForm.role}
                      onChange={(e) =>
                        setEditForm({ ...editForm, role: e.target.value })
                      }
                    >
                      {roles
                        .filter((r) => r !== "")
                        .map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                    </select>
                  ) : (
                    u.role
                  )}
                </td>

                {/* ACTIONS */}
                <td className="p-2 flex gap-2">
                  {editingId === u._id ? (
                    <>
                      <button
                        onClick={() => handleUpdate(u._id)}
                        className="px-2 py-1 bg-green-600 text-white rounded"
                      >
                        Save
                      </button>

                      <button
                        onClick={cancelEdit}
                        className="px-2 py-1 bg-gray-300 rounded"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(u)}
                        className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(u._id)}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
