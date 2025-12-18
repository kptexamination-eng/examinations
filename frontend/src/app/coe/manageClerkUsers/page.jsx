"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Trash2, Search, Loader2, Download, Users } from "lucide-react";
import Swal from "sweetalert2";

export default function ClerkUsersAdmin() {
  const { getToken } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState(new Set());
  const [processingIds, setProcessingIds] = useState(new Set());

  // ========================= FETCH USERS =========================
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      console.log(token);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clerk/list`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch Clerk users");
    } finally {
      setLoading(false);
    }
  };

  // ========================= SEARCH =========================
  const filtered = useMemo(() => {
    if (!query) return users;
    const q = query.toLowerCase();

    return users.filter((u) => {
      const name = (
        (u.firstName || "") +
        " " +
        (u.lastName || "")
      ).toLowerCase();
      const email = (u.email || "").toLowerCase();
      const role = (u.publicMetadata?.role || "").toLowerCase();
      const dept = (u.publicMetadata?.department || "").toLowerCase();

      return (
        name.includes(q) ||
        email.includes(q) ||
        role.includes(q) ||
        dept.includes(q) ||
        (u.id || "").toLowerCase().includes(q)
      );
    });
  }, [users, query]);

  // ========================= PAGINATION =========================
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // ========================= SELECTION =========================
  const toggleSelect = (id) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelected(s);
  };

  const toggleSelectAllOnPage = () => {
    const s = new Set(selected);
    const ids = pageItems.map((u) => u.id);
    const allSelected = ids.every((id) => s.has(id));

    if (allSelected) ids.forEach((id) => s.delete(id));
    else ids.forEach((id) => s.add(id));

    setSelected(s);
  };

  // ========================= SINGLE DELETE =========================
  const deleteUser = async (id) => {
    const result = await Swal.fire({
      title: "Delete User?",
      text: "This Clerk user will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete",
    });

    if (!result.isConfirmed) return;

    setProcessingIds((prev) => new Set(prev).add(id));

    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clerk/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      Swal.fire("Deleted!", "User has been removed.", "success");

      setUsers((list) => list.filter((x) => x.id !== id));
      setSelected((s) => {
        s.delete(id);
        return new Set(s);
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Delete failed.", "error");
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // ========================= BULK DELETE =========================
  const bulkDelete = async () => {
    if (selected.size === 0)
      return Swal.fire("No users selected", "", "warning");

    const result = await Swal.fire({
      title: "Delete selected users?",
      text: `${selected.size} Clerk users will be permanently deleted.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete All",
    });

    if (!result.isConfirmed) return;

    const ids = Array.from(selected);
    setProcessingIds(new Set(ids));

    // Show progress modal
    Swal.fire({
      title: "Deleting users...",
      html: `<strong>0 / ${ids.length}</strong> completed`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    let completed = 0;

    try {
      const token = await getToken();

      for (const id of ids) {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/clerk/${id}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (res.ok) {
            setUsers((list) => list.filter((u) => u.id !== id));
          }

          completed++;

          // Update SweetAlert progress UI
          Swal.update({
            html: `<strong>${completed} / ${ids.length}</strong> completed`,
          });
        } catch (err) {
          console.error(`Failed to delete ${id}`, err);
        }
      }

      Swal.fire("Completed!", "Bulk delete finished.", "success");
      setSelected(new Set());
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Bulk delete failed.", "error");
    } finally {
      setProcessingIds(new Set());
    }
  };

  // ========================= EXPORT CSV =========================
  const exportCSV = () => {
    const cols = [
      "id",
      "email",
      "firstName",
      "lastName",
      "role",
      "department",
      "batch",
      "createdAt",
      "lastSignInAt",
    ];

    const rows = users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      role: u.publicMetadata?.role || "",
      department: u.publicMetadata?.department || "",
      batch: u.publicMetadata?.batch || "",
      createdAt: u.createdAt || "",
      lastSignInAt: u.lastSignInAt || "",
    }));

    const csv =
      cols.join(",") +
      "\n" +
      rows
        .map((r) =>
          cols
            .map((c) => `"${String(r[c] || "").replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "clerk_users.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  // ========================= PAGE UI =========================
  return (
    <div className="p-6 bg-white rounded-xl shadow border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          <h2 className="text-lg font-semibold">Clerk Users</h2>
          <span className="text-sm text-gray-500">({users.length})</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3 py-1 border rounded flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>

          <button
            onClick={fetchUsers}
            className="px-3 py-1 bg-black text-white rounded text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center border rounded p-2 gap-2 flex-1">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            className="w-full outline-none"
            placeholder="Search anything..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="border rounded p-2"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value={10}>10 / page</option>
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>

        <button
          onClick={bulkDelete}
          disabled={selected.size === 0}
          className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4 inline" /> Delete Selected ({selected.size}
          )
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">
                <input
                  type="checkbox"
                  onChange={toggleSelectAllOnPage}
                  checked={
                    pageItems.length > 0 &&
                    pageItems.every((u) => selected.has(u.id))
                  }
                />
              </th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Dept</th>
              <th className="p-2 text-left">Batch</th>
              <th className="p-2 text-left">Created</th>
              <th className="p-2 text-left">Last Login</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="p-6 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </td>
              </tr>
            ) : pageItems.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-6 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              pageItems.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selected.has(u.id)}
                      onChange={() => toggleSelect(u.id)}
                    />
                  </td>
                  <td className="p-2">
                    {u.firstName + " " + (u.lastName || "")}
                  </td>
                  <td className="p-2 break-all">{u.email}</td>
                  <td className="p-2">{u.publicMetadata?.role}</td>
                  <td className="p-2">{u.publicMetadata?.department}</td>
                  <td className="p-2">{u.publicMetadata?.batch}</td>
                  <td className="p-2">
                    {u.createdAt ? new Date(u.createdAt).toLocaleString() : ""}
                  </td>
                  <td className="p-2">
                    {u.lastSignInAt
                      ? new Date(u.lastSignInAt).toLocaleString()
                      : ""}
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => deleteUser(u.id)}
                      disabled={processingIds.has(u.id)}
                      className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                    >
                      {processingIds.has(u.id) ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 text-sm">
        <span>
          Showing {Math.min((page - 1) * pageSize + 1, filtered.length)} –{" "}
          {Math.min(page * pageSize, filtered.length)} of {filtered.length}
        </span>

        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1 border rounded"
            onClick={() => setPage(1)}
            disabled={page === 1}
          >
            First
          </button>
          <button
            className="px-2 py-1 border rounded"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Prev
          </button>

          <input
            value={page}
            onChange={(e) => {
              const p = Number(e.target.value);
              if (!isNaN(p)) setPage(Math.min(Math.max(1, p), totalPages));
            }}
            className="w-16 border rounded text-center p-1"
          />

          <button
            className="px-2 py-1 border rounded"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </button>
          <button
            className="px-2 py-1 border rounded"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}
