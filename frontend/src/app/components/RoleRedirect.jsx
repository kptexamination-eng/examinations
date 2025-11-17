"use client";

import axios from "axios";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function RoleRedirect() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace("/unauthorized");
      return;
    }

    const syncUser = async () => {
      try {
        const token = await getToken();
        console.log(token);
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/syncuser`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (err) {
        console.error("❌ Sync failed:", err.response?.data || err.message);
      }
    };

    // sync with backend MongoDB
    syncUser();

    const role = user?.publicMetadata?.role;

    if (!role) {
      toast.error("❌ You are not permitted to access this page.");
      router.replace("/unauthorized");
      return;
    }

    // REDIRECT BASED ON NEW ROLE SET
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
  }, [isLoaded, isSignedIn, user, getToken, router]);

  return (
    <div className="p-6 text-center">
      <h1 className="text-xl font-bold">Redirecting to your dashboard...</h1>
    </div>
  );
}
