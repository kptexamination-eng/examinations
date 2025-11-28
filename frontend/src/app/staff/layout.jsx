"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useUser, RedirectToSignIn, UserButton, useAuth } from "@clerk/nextjs"; // ⬅ Add useAuth
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Files,
  UserCheck,
  ClipboardCheck,
} from "lucide-react";

export default function StaffLayout({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth(); // ⬅ FIX
  const pathname = usePathname();

  const [hasQPAssignments, setHasQPAssignments] = useState(false);
  const [loadingQP, setLoadingQP] = useState(true);

  // 🟢 ALWAYS call hooks at the top — no condition
  useEffect(() => {
    if (!isSignedIn) return;
    checkAssignments();
  }, [isSignedIn]);

  const checkAssignments = async () => {
    try {
      const token = await getToken(); // ⬅ NOW DEFINED
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/qps/my-qps`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setHasQPAssignments(res.data.length > 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQP(false);
    }
  };

  // ❌ Don't return early before hooks
  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <RedirectToSignIn />;

  const allowed = ["Staff"];
  const isAllowed = allowed.includes(user?.publicMetadata?.role);

  // UI NAVIGATION — ***NO HOOKS BELOW THIS POINT***
  const nav = [
    {
      label: "Profile",
      href: "/staff/myProfile",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "Mark Subject Attendance",
      href: "/staff/StaffAttendanceEntry",
      icon: <Files className="w-5 h-5" />,
    },
    {
      label: "Mark Internal Assessment",
      href: "/staff/IAEntryPage",
      icon: <UserCheck className="w-5 h-5" />,
    },
  ];

  // 🔥 Add QP Menu only if assigned
  if (hasQPAssignments) {
    nav.push({
      label: "Set Question Paper",
      href: "/staff/setQP",
      icon: <ClipboardCheck className="w-5 h-5" />,
    });
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl border-r flex flex-col">
        <div className="h-17 flex items-center px-6 border-b bg-gradient-to-r from-blue-600 to-blue-800">
          <h1 className="text-xl font-semibold text-white">
            {user?.firstName}
          </h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                  ${
                    active
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t bg-gray-50 text-gray-600 text-sm">
          Signed in as <br />
          <span className="font-medium">{user?.firstName}</span>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white shadow-sm px-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            Staff Dashboard
          </h2>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
            >
              Home
            </Link>

            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
