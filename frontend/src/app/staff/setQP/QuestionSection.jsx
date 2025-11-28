"use client";

import { useState } from "react";

export default function QuestionSection({ data, onChange, onDelete }) {
  const [section, setSection] = useState(data);

  const updateField = (field, value) => {
    const newSec = { ...section, [field]: value };
    setSection(newSec);
    onChange(newSec);
  };

  const addQuestion = () => {
    const newSec = {
      ...section,
      questions: [...section.questions, { qNo: "", text: "", marks: 0 }],
    };
    setSection(newSec);
    onChange(newSec);
  };

  const updateQuestion = (index, field, value) => {
    const newQs = [...section.questions];
    newQs[index][field] = value;
    updateField("questions", newQs);
  };

  return (
    <div className="p-4 border rounded mb-6 bg-white shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg">
          {section.label || "Untitled Section"}
        </h2>
        <button onClick={onDelete} className="text-red-600 text-sm">
          ❌ Delete Section
        </button>
      </div>

      <input
        type="text"
        placeholder="Section Label (e.g., Section A)"
        value={section.label}
        onChange={(e) => updateField("label", e.target.value)}
        className="border p-2 w-full mb-3 rounded"
      />

      <textarea
        placeholder="Instructions"
        value={section.instructions}
        onChange={(e) => updateField("instructions", e.target.value)}
        className="border p-2 w-full mb-3 rounded"
      />

      <input
        type="number"
        placeholder="Total Marks"
        value={section.totalMarks}
        onChange={(e) => updateField("totalMarks", e.target.value)}
        className="border p-2 w-full mb-4 rounded"
      />

      {/* QUESTIONS */}
      {section.questions.map((q, idx) => (
        <div key={idx} className="border p-3 rounded mb-3 bg-gray-50">
          <input
            type="text"
            placeholder="Q No (e.g., Q1(a))"
            value={q.qNo}
            onChange={(e) => updateQuestion(idx, "qNo", e.target.value)}
            className="border p-2 w-full mb-2"
          />

          <textarea
            placeholder="Question Text"
            value={q.text}
            onChange={(e) => updateQuestion(idx, "text", e.target.value)}
            className="border p-2 w-full mb-2"
          />

          <input
            type="number"
            placeholder="Marks"
            value={q.marks}
            onChange={(e) => updateQuestion(idx, "marks", e.target.value)}
            className="border p-2 w-full"
          />
        </div>
      ))}

      <button
        onClick={addQuestion}
        className="bg-blue-500 text-white px-4 py-2 rounded text-sm mt-2"
      >
        ➕ Add Question
      </button>
    </div>
  );
}
