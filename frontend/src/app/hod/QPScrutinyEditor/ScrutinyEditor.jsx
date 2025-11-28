"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import Swal from "sweetalert2";
import QuestionSection from "../../staff/setQP/QuestionSection";

export default function ScrutinyEditor({ qp, goBack }) {
  const { getToken } = useAuth();
  const [sections, setSections] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (qp?.sections) {
      setSections(qp.sections);
    }
  }, [qp]);

  if (!qp) return <div className="p-6">Loading question paper...</div>;

  const updateSection = (index, updated) => {
    const newList = [...sections];
    newList[index] = updated;
    setSections(newList);
  };

  const saveScrutinyEdits = async () => {
    const token = await getToken();
    Swal.fire({
      title: "Saving Changes...",
      didOpen: () => Swal.showLoading(),
    });

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/qps/${qp._id}/scrutiny/edit`,
        { sections },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Saved!", "Changes stored successfully", "success");
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Failed to save",
        "error"
      );
    }
  };

  const submitToCOE = async () => {
    if (!remarks.trim())
      return Swal.fire(
        "Remarks required",
        "Provide remarks before submission",
        "warning"
      );

    const token = await getToken();

    Swal.fire({
      title: "Submitting to COE...",
      didOpen: () => Swal.showLoading(),
    });

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/qps/${qp._id}/scrutiny/submit`,
        { note: remarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Submitted!", "Sent to COE for approval", "success");
      goBack();
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Failed to submit",
        "error"
      );
    }
  };

  const sendBackToSetter = async () => {
    if (!remarks.trim())
      return Swal.fire(
        "Remarks required",
        "Provide reason for sending back",
        "warning"
      );

    const token = await getToken();

    Swal.fire({ title: "Sending back...", didOpen: () => Swal.showLoading() });

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/qps/${qp._id}/send-back`,
        { note: remarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Returned!", "Sent back to setter for corrections", "success");
      goBack();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed", "error");
    }
  };

  return (
    <div className="p-6">
      <button onClick={goBack} className="mb-4 px-4 py-2 bg-gray-300 rounded">
        ⬅ Back
      </button>

      <h1 className="text-2xl font-bold mb-6 text-blue-700">
        Scrutiny Review – {qp.subject?.code} ({qp.subject?.name})
      </h1>

      {/* 🔄 Toggle Preview */}
      <button
        onClick={() => setPreviewMode(!previewMode)}
        className="bg-gray-800 text-white px-4 py-2 rounded mb-6"
      >
        {previewMode ? "✏ Back to Editing" : "📄 Preview Paper"}
      </button>

      {/* PREVIEW MODE */}
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
          {/* SCRUTINY EDIT MODE */}
          {sections.map((sec, index) => (
            <QuestionSection
              key={index}
              data={sec}
              onChange={(updated) => updateSection(index, updated)}
              showDelete={false} // 🔥 Scrutiny CANNOT delete entire sections
            />
          ))}

          {/* SAVE BUTTON */}
          <button
            onClick={saveScrutinyEdits}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded"
          >
            💾 Save Changes
          </button>

          {/* RETURN TO SETTER */}
          <div className="mt-10 bg-red-50 border border-red-300 p-4 rounded-md">
            <textarea
              className="w-full border p-3 rounded"
              rows={3}
              placeholder="Enter remarks before sending back..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />

            <button
              onClick={sendBackToSetter}
              className="mt-3 bg-red-600 text-white px-6 py-2 rounded w-full"
            >
              🔁 Send Back to Setter
            </button>
          </div>
          <div className="mt-10 bg-blue-50 border border-blue-300 p-4 rounded-md">
            <textarea
              className="w-full border p-3 rounded"
              rows={3}
              placeholder="Enter scrutiny remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />

            <button
              onClick={submitToCOE}
              className="mt-3 bg-blue-700 text-white px-6 py-2 rounded w-full"
            >
              📤 Submit Scrutiny Review to COE
            </button>
          </div>
        </>
      )}
    </div>
  );
}
