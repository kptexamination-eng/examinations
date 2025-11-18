"use client";

import { useUser, RedirectToSignIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  BookOpen,
  Users,
  CheckSquare,
  FileSpreadsheet,
} from "lucide-react";

export default function HODLayout({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const pathname = usePathname();

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <RedirectToSignIn />;

  // Allowed HOD-only role
  const allowed = ["HOD"];
  if (!allowed.includes(user?.publicMetadata?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-700">
        <div className="p-6 bg-white rounded-lg shadow">
          <p className="text-xl font-semibold">🚫 Access Denied</p>
          <p>You are not allowed to access the HOD panel.</p>
        </div>
      </div>
    );
  }

  const nav = [
    {
      label: "Profile",
      href: "/hod/myProfile",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "Assign Subjects to Staff",
      href: "/hod/staffSubAllocation",
      icon: <UserPlus className="w-5 h-5" />,
    },
    {
      label: "Add Staff",
      href: "/hod/addStaff",
      icon: <UserPlus className="w-5 h-5" />,
    },
    {
      label: "Add Subject",
      href: "/hod/addSubject",
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      label: "Subject List",
      href: "/hod/subjectTable",
      icon: <BookOpen className="w-5 h-5" />,
    },

    {
      label: "Add Student",
      href: "/hod/addStudent",
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: "Student List",
      href: "/hod/studentTable",
      icon: <BookOpen className="w-5 h-5" />,
    },

    {
      label: "Student Edited Profile Approval",
      href: "/hod/studProfileEditApproval",
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      label: "Add Attendance",
      href: "/hod/addAttendance",
      icon: <CheckSquare className="w-5 h-5" />,
    },
    {
      label: "Add IA Marks",
      href: "/hod/addIA",
      icon: <FileSpreadsheet className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl border-r flex flex-col">
        {/* Logo Area */}
        <div className="h-17 flex items-center px-6 border-b bg-gradient-to-r from-purple-600 to-purple-800">
          <h1 className="text-xl font-semibold text-white">HOD Panel</h1>
        </div>

        {/* Navigation */}
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
                      ? "bg-purple-600 text-white shadow-md"
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

        {/* Sidebar Footer */}
        <div className="p-4 border-t bg-gray-50 text-gray-600 text-sm">
          Signed in as <br />
          <span className="font-medium">{user?.firstName}</span>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-white shadow-sm px-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">HOD Dashboard</h2>

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

        {/* Page Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
