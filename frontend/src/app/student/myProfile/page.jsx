"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { toast } from "sonner";

export default function StudentProfile() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const token = await getToken();

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/getstudent/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProfile(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) return <p className="p-6">Loading...</p>;

  if (!profile)
    return (
      <div className="p-6 text-center text-red-500">
        Profile not found. Contact admin.
      </div>
    );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        {/* Image */}
        <div className="flex justify-center">
          <img
            src={profile.imageUrl || "/default-user.png"}
            className="w-32 h-32 object-cover rounded-full border"
            alt="profile"
          />
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500 text-sm">Name</p>
            <p className="font-semibold">{profile.name}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Email</p>
            <p className="font-semibold">{profile.email}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Register Number</p>
            <p className="font-semibold">{profile.registerNumber || "-"}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Phone</p>
            <p className="font-semibold">{profile.phone}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Department</p>
            <p className="font-semibold">{profile.currentDepartment}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Semester</p>
            <p className="font-semibold">{profile.semester}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Batch</p>
            <p className="font-semibold">{profile.batch}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Admission Type</p>
            <p className="font-semibold">{profile.admissionType}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Father's Name</p>
            <p className="font-semibold">{profile.fatherName}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Gender</p>
            <p className="font-semibold">{profile.gender}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
