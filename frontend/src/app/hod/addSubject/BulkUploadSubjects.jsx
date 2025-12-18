"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  XCircle,
} from "lucide-react";

export default function BulkUploadSubjects() {
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState(null);
  // null | "uploading" | "success" | "error"
  const [statusMessage, setStatusMessage] = useState("");

  // -------------------------------
  // Handle File Select
  // -------------------------------
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return toast.error("No file selected");

    setFileName(file.name);
    setLoading(true);
    setStatus("uploading");
    setStatusMessage("Uploading subjects… Please wait.");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      await uploadSubjects(rows);
    } catch (err) {
      toast.error("Invalid Excel file format!");
      setStatus("error");
      setStatusMessage("Invalid Excel file format!");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // Upload JSON to Backend
  // -------------------------------
  const uploadSubjects = async (rows) => {
    try {
      const token = await getToken();

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subjects/bulkjson`,
        { subjects: rows },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log(res.data);

      const msg = `Inserted: ${res.data.inserted} | Skipped: ${res.data.skipped}`;
      toast.success(msg);

      setStatus("success");
      setStatusMessage("Upload completed successfully!");
    } catch (err) {
      toast.error("Bulk upload failed - Unauthorized or server error");
      setStatus("error");
      setStatusMessage("Bulk upload failed. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="mt-10 max-w-xl mx-auto bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
      <h2 className="text-3xl font-bold mb-6 text-blue-700 flex items-center gap-2">
        <FileSpreadsheet className="h-8 w-8 text-blue-600" />
        Bulk Upload Subjects
      </h2>

      {/* Upload Container */}
      <label
        htmlFor="fileInput"
        className="flex flex-col items-center justify-center border-2 border-dashed border-blue-500 p-10 rounded-2xl cursor-pointer bg-blue-50 hover:bg-blue-100 transition shadow-sm hover:shadow-md"
      >
        <UploadCloud className="h-16 w-16 text-blue-600 mb-4" />

        <span className="text-lg font-semibold text-blue-700">
          Click to upload Excel file
        </span>
        <span className="text-sm text-gray-500 mt-2">
          Supports: <strong>.xlsx</strong> / <strong>.xls</strong>
        </span>

        {fileName && (
          <p className="mt-4 text-green-600 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {fileName}
          </p>
        )}
      </label>

      <input
        id="fileInput"
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFile}
      />

      {/* STATUS MESSAGE BOX */}
      {status && (
        <div
          className={`mt-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium 
          ${
            status === "uploading"
              ? "bg-blue-100 text-blue-700"
              : status === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {status === "uploading" && (
            <Loader2 className="w-5 h-5 animate-spin" />
          )}
          {status === "success" && <CheckCircle2 className="w-5 h-5" />}
          {status === "error" && <XCircle className="w-5 h-5" />}

          <span>{statusMessage}</span>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600 flex items-center gap-2">
        <FileSpreadsheet className="w-5 h-5 text-green-600" />
        Download template:
        <a
          href="/subjects_template.xlsx"
          className="text-blue-600 underline font-medium"
        >
          subjects_template.xlsx
        </a>
      </div>
    </div>
  );
}
