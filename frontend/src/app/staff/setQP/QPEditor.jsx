"use client";

import { useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import Swal from "sweetalert2";
import QuestionSection from "./QuestionSection";

export default function QPEditor({ qp, goBack }) {
  const { getToken } = useAuth();
  const [sections, setSections] = useState(qp.sections || []);
  const [previewMode, setPreviewMode] = useState(false);

  const isLocked = [
    "SubmittedToCOE",
    "UnderScrutiny",
    "ApprovedLocked",
  ].includes(qp.status);

  const addSection = () => {
    if (isLocked)
      return Swal.fire("Locked", "This paper cannot be edited now.", "warning");

    setSections([
      ...sections,
      { label: "", instructions: "", totalMarks: 0, questions: [] },
    ]);
  };

  const updateSection = (index, updated) => {
    const newList = [...sections];
    newList[index] = updated;
    setSections(newList);
  };

  const deleteSection = (index) => {
    if (isLocked)
      return Swal.fire("Locked", "This paper cannot be edited now.", "warning");

    setSections(sections.filter((_, i) => i !== index));
  };

  // 🔹 SAVE AS DRAFT
  const saveDraft = async () => {
    if (isLocked)
      return Swal.fire(
        "Locked",
        "Cannot save. QP is already submitted.",
        "error"
      );

    const token = await getToken();
    Swal.fire({ title: "Saving draft...", didOpen: () => Swal.showLoading() });

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/qps/${qp._id}/edit`,
        { sections },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire("Saved!", "Draft updated successfully", "success");
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Failed to save draft",
        "error"
      );
    }
  };

  // 🔹 SUBMIT TO COE
  const submitToCOE = async () => {
    const token = await getToken();

    Swal.fire({
      title: "Submitting...",
      text: "Uploading and finalizing the question paper...",
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
    });

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/qps/${qp._id}/submit`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Submitted!", "Sent to COE for review.", "success");
      goBack();
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Failed to submit",
        "error"
      );
    }
  };
  if (["SubmittedToCOEAfterScrutiny", "ApprovedLocked"].includes(qp.status)) {
    return (
      <div className="p-6 text-red-600 font-semibold">
        ❌ This Question Paper is locked and cannot be edited.
      </div>
    );
  }
  return (
    <div className="pb-20">
      {/* 🔙 Back Button */}
      <button onClick={goBack} className="mb-4 px-4 py-2 bg-gray-300 rounded">
        ⬅ Back
      </button>

      <h1 className="text-2xl font-bold mb-6">
        Editing: {qp.subject?.code} – {qp.subject?.name}
      </h1>

      {/* Status Info */}
      <p className="text-sm mb-4">
        <b>Status:</b>{" "}
        <span
          className={`px-2 py-1 rounded text-white ${
            qp.status === "Assigned"
              ? "bg-gray-600"
              : qp.status === "Draft"
              ? "bg-blue-600"
              : qp.status === "SubmittedToCOE"
              ? "bg-purple-700"
              : qp.status === "UnderScrutiny"
              ? "bg-orange-600"
              : "bg-green-700"
          }`}
        >
          {qp.status}
        </span>
      </p>

      {/* 🔄 Toggle Preview */}
      <button
        onClick={() => setPreviewMode(!previewMode)}
        className="bg-gray-800 text-white px-4 py-2 rounded mb-6"
      >
        {previewMode ? "✏ Back to Editing" : "📄 Preview Paper"}
      </button>

      {/* ===================== PREVIEW MODE ===================== */}
      {previewMode ? (
        <div className="bg-white shadow-lg p-10 mx-auto max-w-3xl border">
          <h2 className="text-center text-xl font-bold mb-2">
            {qp.subject?.name} ({qp.subject?.code})
          </h2>

          <p className="text-center mb-4 text-sm">
            Exam Type: <b>{qp.examType}</b> | Semester: {qp.semester}
          </p>

          <hr className="my-4" />

          {sections.map((sec, sIndex) => (
            <div key={sIndex} className="mb-8">
              <h3 className="font-bold text-lg underline">{sec.label}</h3>
              <p className="italic text-sm mb-2">{sec.instructions}</p>

              <ol className="space-y-3 list-decimal ml-6">
                {sec.questions.map((q, qIndex) => (
                  <li key={qIndex} className="text-sm leading-relaxed">
                    <b>{q.qNo}</b> {q.text}{" "}
                    <span className="font-semibold">({q.marks} marks)</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ===================== EDIT MODE ===================== */}
          {sections.map((sec, index) => (
            <QuestionSection
              key={index}
              data={sec}
              onChange={(updated) => updateSection(index, updated)}
              onDelete={() => deleteSection(index)}
              disabled={isLocked}
            />
          ))}

          {/* Add Section Button */}
          {!isLocked && (
            <button
              onClick={addSection}
              className="mt-5 bg-green-600 text-white px-4 py-2 rounded"
            >
              ➕ Add Section
            </button>
          )}

          {/* Save + Submit Buttons */}
          <div className="mt-10 flex gap-4">
            {!isLocked && (
              <button
                onClick={saveDraft}
                className="bg-blue-600 text-white px-6 py-2 rounded"
              >
                💾 Save Draft
              </button>
            )}

            {qp.status !== "ApprovedLocked" && (
              <button
                onClick={submitToCOE}
                className="bg-purple-600 text-white px-6 py-2 rounded"
              >
                🚀 Submit to COE
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
