"use client";
import axios from "axios";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth(); // 👈 get Clerk JWT
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.replace("/unauthorized");
      return;
    }

    // Wrap async logic in a function
    const syncUser = async () => {
      try {
        const token = await getToken();
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/syncuser`,
          {}, // no body needed
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("✅ Synced user:");
      } catch (err) {
        console.error("❌ Sync error:", err.response?.data || err.message);
      }
    };

    syncUser();

    // Role check
    const role = user.publicMetadata?.role;

    if (!role) {
      toast.error("❌ You are not permitted to access this page.");
      router.replace("/unauthorized");
      return;
    }

    switch (role) {
      case "Student":
        router.replace("/student");
        break;

      case "Staff":
        router.replace("/staff");
        break;

      case "HOD":
        router.replace("/hod");
        break;

      case "COE":
        router.replace("/coe");
        break;

      case "AssistantCOE":
        router.replace("/assistant-coe");
        break;

      case "ChairmanOfExams":
        router.replace("/chairman");
        break;

      case "MarkEntryCaseWorker":
        router.replace("/mark-entry");
        break;

      case "OfficeAdmissions":
        router.replace("/office-admissions");
        break;

      case "OfficeExam":
        router.replace("/office-exam");
        break;

      case "OfficeFee":
        router.replace("/office-fee");
        break;

      case "Admin":
      case "Principal":
      case "Registrar":
        router.replace("/admin");
        break;

      default:
        toast.error("❌ Invalid role configuration");
        router.replace("/unauthorized");
    }
  }, [isLoaded, user, getToken, router]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Loading dashboard...</h1>
    </div>
  );
}
