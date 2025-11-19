"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Pencil, Trash2, Check, X, Upload } from "lucide-react";
import LoaderOverlay from "../../components/LoaderOverlay";

export default function StudentTable() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const role = user?.publicMetadata?.role;
  const hodDepartment = user?.publicMetadata?.department?.toUpperCase();

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null);

  // Editing
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    currentDepartment: "",
    semester: "",
    batch: "",
    fatherName: "",
    gender: "",
    category: "",
    admissionType: "",
    originalDepartment: "",
  });
  const [selectedImage, setSelectedImage] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Sorting
  const sortByRegisterNumber = (arr) => {
    return [...arr].sort((a, b) =>
      (a.registerNumber || "").localeCompare(b.registerNumber || "", "en", {
        numeric: true,
        sensitivity: "base",
      })
    );
  };

  /* -------------------------------------------------------
     FETCH STUDENTS
     ------------------------------------------------------- */
  const fetchStudents = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/getstudents`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let data = res.data.data;
      // HOD restrictions
      if (role === "HOD" && hodDepartment !== "SC") {
        data = data.filter(
          (s) =>
            s.currentDepartment?.toUpperCase() === hodDepartment?.toUpperCase()
        );
      }

      setStudents(sortByRegisterNumber(data));
    } catch (err) {
      toast.error("❌ Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  /* -------------------------------------------------------
     FILTER + SEARCH LOGIC
     ------------------------------------------------------- */
  useEffect(() => {
    let data = [...students];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.registerNumber || "").toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    if (yearFilter !== "all") {
      if (yearFilter === "1")
        data = data.filter((s) => [1, 2].includes(Number(s.semester)));
      else if (yearFilter === "2")
        data = data.filter((s) => [3, 4].includes(Number(s.semester)));
      else if (yearFilter === "3")
        data = data.filter((s) => [5, 6].includes(Number(s.semester)));
    }

    setFilteredStudents(sortByRegisterNumber(data));
    setPage(1);
  }, [students, searchTerm, yearFilter]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginated = filteredStudents.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  /* -------------------------------------------------------
     EDITING
     ------------------------------------------------------- */
  const startEditing = (s) => {
    setEditingId(s._id);
    setEditForm({
      name: s.name,
      email: s.email,
      phone: s.phone,
      currentDepartment: s.currentDepartment,
      semester: s.semester,
      batch: s.batch,
      fatherName: s.fatherName,
      gender: s.gender,
      category: s.category,
      admissionType: s.admissionType,
      originalDepartment: s.originalDepartment, // read-only
    });

    setSelectedImage(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setSelectedImage(null);
  };

  const handleChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  /* -------------------------------------------------------
     UPDATE STUDENT
     ------------------------------------------------------- */
  const handleUpdate = async (id) => {
    try {
      setAction("updating");
      const token = await getToken();

      const formData = new FormData();
      Object.entries(editForm).forEach(([k, v]) => {
        formData.append(k, v);
      });

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/updatestudent/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("✅ Student updated");
      setStudents((prev) =>
        prev.map((s) => (s._id === id ? res.data.data : s))
      );
      cancelEditing();
    } catch (err) {
      toast.error("❌ Update failed");
    } finally {
      setAction(null);
    }
  };

  /* -------------------------------------------------------
     DELETE STUDENT
     ------------------------------------------------------- */
  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      setAction("deleting");
      const token = await getToken();

      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/deletestudent/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Deleted");
      setStudents((prev) => prev.filter((s) => s._id !== id));
    } catch {
      toast.error("❌ Failed to delete");
    } finally {
      setAction(null);
    }
  };

  /* -------------------------------------------------------
     UI RENDER
     ------------------------------------------------------- */
  return (
    <div className="mt-6 relative overflow-x-auto text-sm">
      {action && <LoaderOverlay message="Processing..." />}

      <h2 className="text-lg font-semibold mb-3">Students List</h2>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search name, reg no, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-2 py-1 rounded w-full md:w-1/3 text-sm"
        />
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="border px-2 py-1 rounded w-full md:w-1/4 text-sm"
        >
          <option value="all">All Years</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <table className="w-full border border-gray-200 rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Sl</th>
              <th className="p-2">Image</th>
              <th className="p-2">Reg No</th>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Father</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Dept</th>
              <th className="p-2">Sem</th>
              <th className="p-2">Batch</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((s, i) => (
              <tr key={s._id} className="border-t">
                <td className="p-2">{(page - 1) * pageSize + i + 1}</td>

                {/* IMAGE */}
                <td className="p-2">
                  {editingId === s._id ? (
                    <div>
                      <label className="text-blue-600 cursor-pointer text-xs flex items-center gap-1">
                        <Upload className="w-3 h-3" /> Change
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            setSelectedImage(e.target.files[0] || null)
                          }
                        />
                      </label>
                      <img
                        src={
                          selectedImage
                            ? URL.createObjectURL(selectedImage)
                            : s.imageUrl
                        }
                        className="w-8 h-8 rounded-full mt-1 object-cover"
                      />
                    </div>
                  ) : (
                    <img
                      src={s.imageUrl}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                </td>

                {/* REGISTER NUMBER */}
                <td className="p-2">{s.registerNumber || "-"}</td>

                {/* NAME */}
                <td className="p-2">
                  {editingId === s._id ? (
                    <input
                      name="name"
                      value={editForm.name}
                      onChange={handleChange}
                      className="border rounded px-1 py-0.5 w-full"
                    />
                  ) : (
                    s.name
                  )}
                </td>

                {/* EMAIL */}
                <td className="p-2">
                  {editingId === s._id ? (
                    <input
                      name="email"
                      value={editForm.email}
                      onChange={handleChange}
                      className="border rounded px-1 py-0.5 w-full"
                    />
                  ) : (
                    s.email
                  )}
                </td>

                {/* PHONE */}
                <td className="p-2">
                  {editingId === s._id ? (
                    <input
                      name="phone"
                      value={editForm.phone}
                      onChange={handleChange}
                      className="border rounded px-1 py-0.5 w-full"
                    />
                  ) : (
                    s.phone
                  )}
                </td>

                {/* FATHER NAME — NEW! */}
                <td className="p-2">
                  {editingId === s._id ? (
                    <input
                      name="fatherName"
                      value={editForm.fatherName}
                      onChange={handleChange}
                      className="border rounded px-1 py-0.5 w-full uppercase"
                    />
                  ) : (
                    s.fatherName
                  )}
                </td>

                {/* GENDER — NEW! */}
                <td className="p-2">
                  {editingId === s._id ? (
                    <select
                      name="gender"
                      value={editForm.gender}
                      onChange={handleChange}
                      className="border rounded px-1 py-0.5 w-full"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  ) : (
                    s.gender
                  )}
                </td>

                {/* CURRENT DEPARTMENT */}
                <td className="p-2 uppercase">
                  {editingId === s._id ? (
                    <input
                      name="currentDepartment"
                      value={editForm.currentDepartment}
                      onChange={handleChange}
                      className="border rounded px-1 py-0.5 w-full uppercase"
                    />
                  ) : (
                    s.currentDepartment
                  )}
                </td>

                {/* SEMESTER */}
                <td className="p-2">
                  {editingId === s._id ? (
                    <input
                      type="number"
                      min="1"
                      max="6"
                      name="semester"
                      value={editForm.semester}
                      onChange={handleChange}
                      className="border rounded px-1 py-0.5 w-full"
                    />
                  ) : (
                    s.semester
                  )}
                </td>

                {/* BATCH */}
                <td className="p-2">
                  {editingId === s._id ? (
                    <input
                      name="batch"
                      value={editForm.batch}
                      onChange={handleChange}
                      className="border rounded px-1 py-0.5 w-full"
                    />
                  ) : (
                    s.batch
                  )}
                </td>

                {/* ACTIONS */}
                <td className="p-2 flex gap-2">
                  {editingId === s._id ? (
                    <>
                      <button
                        onClick={() => handleUpdate(s._id)}
                        className="text-green-600"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEditing} className="text-gray-500">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(s)}
                        className="text-blue-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {paginated.length === 0 && (
              <tr>
                <td colSpan="10" className="p-4 text-center text-gray-500">
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* PAGINATION */}
      <div className="flex justify-center items-center gap-2 mt-3 text-sm">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="border px-2 py-1 rounded disabled:opacity-50"
        >
          Prev
        </button>

        <span>
          Page {page} of {totalPages || 1}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="border px-2 py-1 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
