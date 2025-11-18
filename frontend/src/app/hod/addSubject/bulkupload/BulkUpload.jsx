"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import LoaderOverlay from "../../../components/LoaderOverlay";
import { Upload, FileSpreadsheet, Loader2, CheckCircle } from "lucide-react";

export default function BulkUpload() {
  const { getToken } = useAuth();
  const [status, setStatus] = useState(null);
  const [students, setStudents] = useState([]);
  const [fileName, setFileName] = useState("");
  const [loadingFile, setLoadingFile] = useState(false);

  const REQUIRED_FIELDS = [
    "name",
    "email",
    "phone",
    "currentDepartment",
    "semester",
    "batch",
    "fatherName",
    "gender",
    "category",
    "admissionType",
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoadingFile(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const parsed = XLSX.utils.sheet_to_json(sheet);

        // VALIDATE FIELDS
        const missingRows = parsed.filter((s) =>
          REQUIRED_FIELDS.some((f) => !s[f])
        );

        if (missingRows.length > 0) {
          toast.error("❌ Missing required fields. Check console for details.");
          console.log("Missing rows:", missingRows);
          setLoadingFile(false);
          return;
        }

        const processed = parsed.map((s) => {
          const formatted = {
            ...s,
            currentDepartment: s.currentDepartment.toUpperCase(),
            fatherName: s.fatherName.toUpperCase(),
            name: s.name.toUpperCase(),
            gender: s.gender.toUpperCase(),
            category: s.category.toUpperCase(),
            admissionType: s.admissionType.toUpperCase(),
          };

          if (
            formatted.admissionType === "REGULAR" ||
            formatted.admissionType === "LATERAL"
          ) {
            formatted.originalDepartment = "00";
          }

          if (formatted.admissionType === "TRANSFER") {
            formatted.originalDepartment =
              s.originalDepartment?.toUpperCase() || "";
          }

          return formatted;
        });

        setStudents(processed);
        toast.success(`✅ ${parsed.length} students loaded successfully`);
      } catch (err) {
        console.error(err);
        toast.error("❌ Failed to read file");
      } finally {
        setLoadingFile(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (!students.length) return toast.error("No students loaded!");

    setStatus("saving");

    try {
      const token = await getToken();
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/bulk-add`,
        { students },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) toast.success("🎉 Bulk upload completed!");
      else toast.error("Some rows failed. Please check logs.");

      setStudents([]);
      setFileName("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "❌ Upload failed");
    } finally {
      setStatus(null);
    }
  };

  return (
    <section className="p-6 bg-white rounded-2xl shadow-md border border-gray-200 mt-8 transition">
      {(status === "saving" || loadingFile) && (
        <LoaderOverlay
          message={
            status === "saving"
              ? "Uploading students..."
              : "Reading Excel file..."
          }
        />
      )}

      <h2 className="text-2xl font-semibold mb-6 text-gray-900 flex items-center gap-2">
        <FileSpreadsheet className="w-7 h-7 text-blue-600" />
        Bulk Student Upload
      </h2>

      {/* Upload Box */}
      <label
        htmlFor="file-upload"
        className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-xl p-10 cursor-pointer hover:bg-gray-50 transition shadow-sm"
      >
        {loadingFile ? (
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-2" />
        ) : (
          <Upload className="w-12 h-12 text-blue-600 mb-2" />
        )}

        <span className="text-gray-800 font-semibold text-lg">
          {fileName ? "Change Excel File" : "Click to Upload Excel File"}
        </span>

        <span className="text-sm text-gray-500 mt-1">
          Supports .xlsx & .xls files
        </span>

        <input
          id="file-upload"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
        />
      </label>

      {/* File indicator */}
      {fileName && (
        <div className="flex items-center gap-3 mt-5 p-3 bg-gray-100 rounded-lg shadow-sm">
          <FileSpreadsheet className="w-6 h-6 text-green-600" />
          <span className="text-gray-700 font-medium">{fileName}</span>
        </div>
      )}

      {/* Student Count */}
      {students.length > 0 && (
        <div className="mt-4 flex items-center gap-2 text-green-700 font-medium bg-green-50 p-3 rounded-lg border border-green-200">
          <CheckCircle className="w-5 h-5" />
          {students.length} students ready to upload
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!students.length || status === "saving"}
        className="mt-6 w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "saving" ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Uploading...
          </span>
        ) : (
          "Upload Students"
        )}
      </button>
    </section>
  );
}
