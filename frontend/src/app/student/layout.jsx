"use client";

import { useUser, RedirectToSignIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Files,
  UserCheck,
  ClipboardCheck,
} from "lucide-react";

export default function AdminLayout({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const pathname = usePathname();

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <RedirectToSignIn />;

  // Allowed admin-level roles
  const allowed = ["Student"];
  if (!allowed.includes(user?.publicMetadata?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-700">
        <div className="p-6 bg-white rounded-lg shadow">
          <p className="text-xl font-semibold">🚫 Access Denied</p>
          <p>You are not allowed to access the admin panel.</p>
        </div>
      </div>
    );
  }

  const nav = [
    {
      label: "Profile",
      href: "/student/myProfile",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "Edit Profile",
      href: "/student/editProfile",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "Subject Attendance",
      href: "/student/myAttendance",
      icon: <Files className="w-5 h-5" />,
    },
    {
      label: "Internal Assessment",
      href: "/student/myIA",
      icon: <UserCheck className="w-5 h-5" />,
    },
    {
      label: "Exam Fee Status",
      href: "/student/FeeStatus",
      icon: <ClipboardCheck className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl border-r flex flex-col">
        {/* Logo Area */}
        <div className="h-17 flex items-center px-6 border-b bg-gradient-to-r from-blue-600 to-blue-800">
          <h1 className="text-xl font-semibold text-white">
            {user?.firstName}
          </h1>
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
          <h2 className="text-xl font-semibold text-gray-800">
            Student Dashboard
          </h2>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
            >
              Home
            </Link>

            {/* Clerk Profile / Settings / Logout */}
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
