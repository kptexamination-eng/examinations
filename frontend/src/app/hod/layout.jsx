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
      icon: <LayoutDashboard size={20} />,
    },
    {
      label: "Hall Ticket Generation",
      href: "/hod/halltickets",
      icon: <FileSpreadsheet size={20} />,
    },
    {
      label: "Assign Subjects to Staff",
      href: "/hod/staffSubAllocation",
      icon: <Users size={20} />,
    },
    {
      label: "Manage Subjects to Staff",
      href: "/hod/HODManageAllocations",
      icon: <CheckSquare size={20} />,
    },
    { label: "Add Staff", href: "/hod/addStaff", icon: <UserPlus size={20} /> },
    {
      label: "Add Subject",
      href: "/hod/addSubject",
      icon: <BookOpen size={20} />,
    },
    {
      label: "Subject List",
      href: "/hod/subjectTable",
      icon: <BookOpen size={20} />,
    },
    {
      label: "Add Student",
      href: "/hod/addStudent",
      icon: <UserPlus size={20} />,
    },
    {
      label: "Student List",
      href: "/hod/studentTable",
      icon: <Users size={20} />,
    },
    {
      label: "Student Edited Profile Approval",
      href: "/hod/studProfileEditApproval",
      icon: <CheckSquare size={20} />,
    },
    {
      label: "Approve Attendance",
      href: "/hod/HODAttendanceApproval",
      icon: <CheckSquare size={20} />,
    },
    {
      label: "Download Attendance",
      href: "/hod/HODAttendanceDownload",
      icon: <FileSpreadsheet size={20} />,
    },
    {
      label: "Approve IA Marks",
      href: "/hod/iaApproval",
      icon: <FileSpreadsheet size={20} />,
    },
    {
      label: "IA Eligibility Download",
      href: "/hod/iaEligibilitydownload",
      icon: <FileSpreadsheet size={20} />,
    },
    {
      label: "Scrutinise Question Paper",
      href: "/hod/QPScrutinyEditor",
      icon: <BookOpen size={20} />,
    },
  ];

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl border-r flex flex-col">
        {/* Logo Area */}
        <div className="h-17 flex items-center px-6 border-b bg-gradient-to-r from-[#5a3fff] to-[#8e4dff]">
          <h1 className="text-xl font-semibold text-white tracking-wide">
            HOD Panel
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
            ${
              active
                ? "bg-gradient-to-r from-[#6f4bff] to-[#b064ff] text-white shadow-lg scale-[1.02]"
                : "text-gray-700 hover:bg-gray-100"
            }
          `}
              >
                <span
                  className={`transition-transform group-hover:scale-110 ${
                    active ? "text-white" : "text-purple-600"
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
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
