"use client";

import { useUser, RedirectToSignIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Files } from "lucide-react";

export default function OfficeFeeLayout({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const pathname = usePathname();

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <RedirectToSignIn />;

  // ✅ ONLY Fee Office staff allowed
  const allowedRoles = ["OfficeFee"];
  const userRole = user?.publicMetadata?.role;

  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="p-6 bg-white rounded-lg shadow text-center">
          <p className="text-xl font-semibold text-red-700">🚫 Access Denied</p>
          <p className="text-gray-600 mt-2">
            This portal is restricted to the Fee Section staff only.
          </p>
        </div>
      </div>
    );
  }

  const nav = [
    {
      label: "My Profile",
      href: "/office-fee/myProfile",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "Fee Verification",
      href: "/office-fee/OfficeFeeDashboard",
      icon: <Files className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl border-r flex flex-col">
        {/* Header */}
        <div className="h-16 flex items-center px-6 border-b bg-gradient-to-r from-blue-600 to-blue-800">
          <h1 className="text-lg font-semibold text-white">Fee Section</h1>
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

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 text-gray-600 text-sm">
          Signed in as
          <div className="font-medium">{user?.firstName}</div>
          <div className="text-xs text-gray-500">{userRole}</div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-white shadow-sm px-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            Fee Verification Dashboard
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

        {/* Page Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
