"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

export default function HODSubjectAllocation() {
  const { getToken } = useAuth();

  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("A");

  const [subjects, setSubjects] = useState([]);
  const [staff, setStaff] = useState([]);

  const [selectedSubject, setSelectedSubject] = useState("");
  const [staffEntries, setStaffEntries] = useState([
    { staffId: "", portions: "" },
  ]);

  const [loading, setLoading] = useState(false);

  // -------------------------------------------------------
  // 1. Load subjects for selected semester
  // -------------------------------------------------------
  const loadSubjects = async () => {
    if (!semester) return;
    setLoading(true);

    try {
      const token = await getToken();

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subjects/getsubjects?semester=${semester}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(res.data);
      setSubjects(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // 2. Load department staff
  // -------------------------------------------------------
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const token = await getToken();

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/getusers?role=Staff`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setStaff(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };

    loadStaff();
  }, []);

  // -------------------------------------------------------
  // Add new staff entry
  // -------------------------------------------------------
  const addStaffEntry = () => {
    setStaffEntries([...staffEntries, { staffId: "", portions: "" }]);
  };

  // Remove staff entry
  const removeEntry = (index) => {
    const updated = [...staffEntries];
    updated.splice(index, 1);
    setStaffEntries(updated);
  };

  // Update staff entry
  const updateEntry = (index, field, value) => {
    const updated = [...staffEntries];
    updated[index][field] = value;
    setStaffEntries(updated);
  };

  // -------------------------------------------------------
  // 3. Submit allocation
  // -------------------------------------------------------
  const submitAllocation = async () => {
    if (!selectedSubject) return alert("Select a subject");

    try {
      const token = await getToken();

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subject-allocations`,
        {
          subjectId: selectedSubject,
          semester,
          section,
          department: subjects.find((s) => s._id === selectedSubject)
            ?.department,
          staff: staffEntries,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Subject allocated successfully!");
    } catch (error) {
      console.error(error);
      alert("Unable to allocate subject");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-5">HOD - Subject Allocation</h1>

      {/* Semester Selector */}
      <label>Semester</label>
      <select
        className="border p-2 rounded w-full mb-4"
        value={semester}
        onChange={(e) => setSemester(e.target.value)}
      >
        <option value="">-- Select Semester --</option>
        {[1, 2, 3, 4, 5, 6].map((sem) => (
          <option key={sem} value={sem}>
            {sem}
          </option>
        ))}
      </select>

      {/* Section Selector */}
      <label>Section</label>
      <select
        className="border p-2 rounded w-full mb-4"
        value={section}
        onChange={(e) => setSection(e.target.value)}
      >
        {["A", "B", "C"].map((sec) => (
          <option key={sec} value={sec}>
            {sec}
          </option>
        ))}
      </select>

      {/* Load Subjects Button */}
      <button
        onClick={loadSubjects}
        disabled={!semester}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        Load Subjects
      </button>

      {/* Subject Selector */}
      {subjects.length > 0 && (
        <>
          <label>Select Subject</label>
          <select
            className="border p-2 rounded w-full mb-4"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">-- Select Subject --</option>

            {subjects.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.code} - {sub.name}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Staff Entries */}
      {selectedSubject && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Assign Staff</h2>

          {staffEntries.map((entry, index) => (
            <div
              key={index}
              className="border p-3 rounded mb-3 bg-gray-50 flex gap-3"
            >
              {/* Select Staff */}
              <select
                className="border p-2 rounded flex-1"
                value={entry.staffId}
                onChange={(e) => updateEntry(index, "staffId", e.target.value)}
              >
                <option value="">-- Select Staff --</option>

                {staff.map((st) => (
                  <option key={st._id} value={st._id}>
                    {st.name} ({st.email})
                  </option>
                ))}
              </select>

              {/* Portion Notes */}
              <input
                type="text"
                placeholder="Portions (e.g., Units 1-2)"
                value={entry.portions}
                onChange={(e) => updateEntry(index, "portions", e.target.value)}
                className="border p-2 rounded flex-1"
              />

              {/* Remove */}
              {index > 0 && (
                <button
                  onClick={() => removeEntry(index)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  X
                </button>
              )}
            </div>
          ))}

          {/* Add More Staff */}
          <button
            onClick={addStaffEntry}
            className="bg-gray-700 text-white px-4 py-2 rounded"
          >
            + Add Another Staff
          </button>

          {/* Save Allocation */}
          <button
            onClick={submitAllocation}
            className="bg-green-600 text-white px-4 py-2 rounded mt-6 block"
          >
            Save Allocation
          </button>
        </div>
      )}
    </div>
  );
}
