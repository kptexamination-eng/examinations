"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import LoaderOverlay from "../../components/LoaderOverlay";

export default function EditProfile() {
  const { getToken } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // <-- NEW (for overlay)
  const [formData, setFormData] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);

  // -----------------------------------------
  // Load own profile
  // -----------------------------------------
  const fetchProfile = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/getstudent/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(res.data.data);
      setFormData(res.data.data);
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // -----------------------------------------
  // Submit request (with loader)
  // -----------------------------------------
  const handleSubmit = async () => {
    try {
      setSaving(true); // show overlay
      const token = await getToken();
      const fd = new FormData();

      // Only send changed fields
      Object.entries(formData).forEach(([key, val]) => {
        if (val !== profile[key]) {
          fd.append(key, val);
        }
      });

      if (selectedImage) {
        fd.append("image", selectedImage);
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/request-edit`,
        fd,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Request submitted. Waiting for HOD approval.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setSaving(false); // hide overlay
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* Overlay loader */}
      {saving && <LoaderOverlay message="Submitting request..." />}

      <h1 className="text-xl font-bold mb-4">Edit My Profile</h1>

      {/* IMAGE UPLOAD */}
      <div className="flex justify-center mb-6">
        <div className="text-center">
          <img
            src={
              selectedImage
                ? URL.createObjectURL(selectedImage)
                : profile.imageUrl || "/default-user.png"
            }
            className="w-32 h-32 rounded-full object-cover border mb-2"
          />

          <label className="cursor-pointer text-blue-600 flex items-center justify-center gap-2 text-sm">
            <Upload className="w-4 h-4" /> Change Photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setSelectedImage(e.target.files[0])}
            />
          </label>
        </div>
      </div>

      {/* EDIT FIELDS */}
      {[
        "name",
        "phone",
        "fatherName",
        "motherName",
        "gender",
        "category",
        "semester",
        "batch",
      ].map((key) => (
        <div key={key} className="mb-4">
          <label className="text-sm text-gray-600 capitalize">{key}</label>
          <input
            value={formData[key] || ""}
            onChange={(e) =>
              setFormData({ ...formData, [key]: e.target.value })
            }
            className="border px-3 py-2 rounded w-full"
          />
        </div>
      ))}

      <button
        className="px-4 py-2 bg-blue-600 text-white rounded w-full disabled:bg-gray-400"
        disabled={saving}
        onClick={handleSubmit}
      >
        {saving ? "Submitting..." : "Submit for Approval"}
      </button>
    </div>
  );
}
