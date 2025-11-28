"use client";

export default function LockedQPViewer({ qp, goBack }) {
  if (!["ApprovedLocked", "SubmittedToCOEAfterScrutiny"].includes(qp.status)) {
    return (
      <div className="p-6 text-red-600">❌ This paper is not finalized.</div>
    );
  }

  return (
    <div className="p-10 max-w-3xl mx-auto bg-white shadow-lg border print:border-none print:shadow-none">
      {/* 🔙 Back Button (hidden in print) */}
      <button
        onClick={goBack}
        className="mb-4 px-4 py-2 bg-gray-300 rounded print:hidden"
      >
        ⬅ Back
      </button>

      {/* 🖨 Print Button */}
      <button
        onClick={() => window.print()}
        className="mb-4 ml-3 px-4 py-2 bg-blue-700 text-white rounded print:hidden"
      >
        🖨 Print
      </button>

      {/* HEADER SECTION */}
      <h1 className="text-center text-xl font-bold mb-1">
        {qp.subject?.name} ({qp.subject?.code})
      </h1>

      <p className="text-center mb-4 text-sm">
        <b>Exam:</b> {qp.examType} &nbsp;|&nbsp; <b>Semester:</b> {qp.semester}
      </p>

      <hr className="my-4 border-black" />

      {/* SECTION DISPLAY */}
      {qp.sections.map((sec, sIndex) => (
        <div key={sIndex} className="mb-10">
          <h3 className="font-bold text-lg underline">{sec.label}</h3>
          <p className="italic text-sm mb-3">{sec.instructions}</p>

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
  );
}
