"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo + App Name */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-700">
            KPT Examination
          </span>
        </Link>

        {/* Auth Buttons */}
        <div>
          <SignedOut>
            <SignInButton>
              <button className="px-5 py-2 bg-blue-600 text-white font-medium rounded-full shadow hover:bg-blue-700 transition">
                Login
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Link
              href="/dashboard"
              className="px-5 py-2 bg-gray-200 font-medium rounded-full shadow hover:bg-gray-300 transition"
            >
              Dashboard
            </Link>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
