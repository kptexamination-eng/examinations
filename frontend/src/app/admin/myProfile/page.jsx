"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function UserProfile() {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------------------
  // FETCH LOGGED-IN USER PROFILE (Clerk → Backend sync → MongoDB user)
  // -------------------------------------------------------------------
  const fetchProfile = async () => {
    try {
      const token = await getToken();

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/syncuser`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(res.data.data);
      setProfile(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clerkUser) fetchProfile();
  }, [clerkUser]);

  if (loading)
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  if (!profile)
    return (
      <div className="p-6 text-center text-red-600">
        Could not load your profile.
      </div>
    );

  // ---------------------------------------------
  // PROFILE VIEW (modern card layout)
  // ---------------------------------------------
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="bg-white shadow rounded-xl p-6 flex flex-col sm:flex-row gap-6">
        {/* ------------------------ */}
        {/* PROFILE PHOTO */}
        {/* ------------------------ */}
        <div className="flex flex-col items-center sm:w-1/3">
          <img
            src={
              profile.imageUrl || clerkUser?.imageUrl || "/default-avatar.png"
            }
            className="w-32 h-32 object-cover rounded-full border shadow"
          />
          <p className="mt-3 font-semibold">{profile.name}</p>
          <p className="text-gray-500 text-sm">{profile.role}</p>
        </div>

        {/* ------------------------ */}
        {/* DETAILS */}
        {/* ------------------------ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
          <ProfileField label="Name" value={profile.name} />
          <ProfileField label="Email" value={profile.email} />
          <ProfileField label="Phone" value={profile.phone} />
          <ProfileField label="Role" value={profile.role} />
          <ProfileField label="Department" value={profile.department || "—"} />
          <ProfileField
            label="Active Status"
            value={profile.isActive ? "Active" : "Inactive"}
          />
        </div>
      </div>
    </div>
  );
}

/* -----------------------------
   REUSABLE FIELD COMPONENT
------------------------------ */
function ProfileField({ label, value }) {
  return (
    <div className="p-3 border rounded-lg bg-gray-50">
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className="font-semibold">{value || "—"}</p>
    </div>
  );
}
