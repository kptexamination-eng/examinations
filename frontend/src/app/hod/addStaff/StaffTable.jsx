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
];

export default function StaffTable() {
  const { getToken } = useAuth();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    image: null, // NEW
  });

  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");

  // Fetch staff list
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/getusers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStaff(res.data.data.filter((u) => u.role === "Staff"));
    } catch (err) {
      toast.error("❌ Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Enter edit mode
  const startEditing = (s) => {
    setEditingId(s._id);
    setEditForm({
      name: s.name,
      email: s.email,
      phone: s.phone,
      department: s.department,
      image: null, // reset on edit
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({
      name: "",
      email: "",
      phone: "",
      department: "",
      image: null,
    });
  };

  // Handle update – MULTIPART FORM NOW
  const handleUpdate = async (id) => {
    try {
      setAction("updating");
      const token = await getToken();

      const formData = new FormData();
      formData.append("name", editForm.name);
      formData.append("email", editForm.email);
      formData.append("phone", editForm.phone);
      formData.append("department", editForm.department);

      if (editForm.image) {
        formData.append("image", editForm.image);
      }

      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/updateuser/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("✅ Staff updated successfully");
      setStaff(staff.map((s) => (s._id === id ? res.data.data : s)));

      cancelEditing();
    } catch (err) {
      toast.error("❌ Failed to update staff");
      console.error(err);
    } finally {
      setAction(null);
    }
  };

  // Delete staff
  const handleDelete = async (id) => {
    if (!confirm("Delete this staff member?")) return;

    try {
      setAction("deleting");
      const token = await getToken();

      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/deleteuser/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Staff deleted");
      setStaff(staff.filter((s) => s._id !== id));
    } catch (err) {
      toast.error("❌ Failed to delete staff");
    } finally {
      setAction(null);
    }
  };

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.toLowerCase().includes(search.toLowerCase());

    const matchesDept = filterDept ? s.department === filterDept : true;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="mt-10 relative">
      {action && (
        <LoaderOverlay
          message={
            action === "updating" ? "Updating staff..." : "Deleting staff..."
          }
        />
      )}

      <h2 className="text-xl font-semibold mb-4">List of Staff</h2>

      {/* Search + Department Filter */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-1/2">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 border rounded-lg w-full"
          />
        </div>

        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="border px-3 py-2 rounded-lg"
        >
          {departments.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Staff Table */}
      {loading ? (
        <p>Loading staff...</p>
      ) : (
        <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-center">Sl. No</th>
              <th className="p-2 text-left">Image</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Department</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredStaff.map((s, index) => (
              <tr key={s._id} className="border-t">
                <td className="p-2 text-center">{index + 1}</td>

                {/* Show current OR preview image */}
                <td className="p-2">
                  {editingId === s._id ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={
                          editForm.image
                            ? URL.createObjectURL(editForm.image)
                            : s.imageUrl
                        }
                        className="w-10 h-10 rounded-full object-cover border mb-1"
                      />

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            image: e.target.files[0],
                          })
                        }
                      />
                    </div>
                  ) : s.imageUrl ? (
                    <img
                      src={s.imageUrl}
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                      N/A
                    </div>
                  )}
                </td>

                <td className="p-2">
                  {editingId === s._id ? (
                    <input
                      name="name"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    s.name
                  )}
                </td>

                <td className="p-2">
                  {editingId === s._id ? (
                    <input
                      name="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    s.email
                  )}
                </td>

                <td className="p-2">
                  {editingId === s._id ? (
                    <input
                      name="phone"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    s.phone
                  )}
                </td>

                <td className="p-2 uppercase">
                  {editingId === s._id ? (
                    <select
                      name="department"
                      value={editForm.department}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          department: e.target.value,
                        })
                      }
                      className="border rounded px-2 py-1 w-full"
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
                    s.department
                  )}
                </td>

                {/* ACTION BUTTONS */}
                <td className="p-2 flex gap-2">
                  {editingId === s._id ? (
                    <>
                      <button
                        className="text-green-600"
                        onClick={() => handleUpdate(s._id)}
                      >
                        Save
                      </button>
                      <button className="text-gray-600" onClick={cancelEditing}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="text-blue-600"
                        onClick={() => startEditing(s)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600"
                        onClick={() => handleDelete(s._id)}
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
