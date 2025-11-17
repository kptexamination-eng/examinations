"use client";

import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">
          Welcome to KPT Examination Portal
        </h1>
        <p className="mb-10 text-lg text-gray-600">
          Students and staff can check for updates here.
        </p>
      </main>
    </div>
  );
}
