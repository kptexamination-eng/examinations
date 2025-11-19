// "use client";

// import { useEffect, useState } from "react";
// import axios from "axios";
// import { useAuth } from "@clerk/nextjs";

// export default function StudentIAView() {
//   const { getToken } = useAuth();
//   const [records, setRecords] = useState([]);

//   useEffect(() => {
//     (async () => {
//       const token = await getToken();

//       const res = await axios.get(
//         `${process.env.NEXT_PUBLIC_API_URL}/api/ia/student/my`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       console.log(res.data);
//       setRecords(res.data);
//     })();
//   }, []);

//   return (
//     <div className="p-6">
//       <h1 className="text-xl font-bold mb-4">My Internal Assessment</h1>

//       {records.length === 0 && <p>No IA records found.</p>}

//       {records.length > 0 && (
//         <table className="w-full text-sm border">
//           <thead className="bg-gray-200">
//             <tr>
//               <th className="border p-2">Subject</th>
//               <th className="border p-2">Final IA</th>
//               <th className="border p-2">Max</th>
//               <th className="border p-2">Eligibility</th>
//             </tr>
//           </thead>
//           <tbody>
//             {records.map((r) => (
//               <tr key={r._id}>
//                 <td className="p-2 border">
//                   {r.subjectAllocation.subject.code} -{" "}
//                   {r.subjectAllocation.subject.name}
//                 </td>
//                 <td className="p-2 border">{r.finalIA}</td>
//                 <td className="p-2 border">{r.maxMarks}</td>
//                 <td className="p-2 border">
//                   {r.isEligible ? "Eligible" : "Not Eligible"}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

export default function StudentIAView() {
  const { getToken } = useAuth();
  const [records, setRecords] = useState([]);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ia/student/full`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecords(res.data);
    })();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">My Internal Assessment</h1>

      <table className="w-full text-sm border">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">Subject</th>
            <th className="border p-2">Final IA</th>
            <th className="border p-2">Max</th>
            <th className="border p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.allocationId}>
              <td className="p-2 border">
                {r.subject.code} - {r.subject.name}
              </td>

              <td className="p-2 border">
                {r.finalIA !== null ? r.finalIA : "—"}
              </td>

              <td className="p-2 border">{r.maxMarks}</td>

              <td
                className={`p-2 border ${
                  r.status === "Approved"
                    ? "text-green-600"
                    : r.status === "Pending Approval"
                    ? "text-orange-500"
                    : "text-gray-500"
                }`}
              >
                {r.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
