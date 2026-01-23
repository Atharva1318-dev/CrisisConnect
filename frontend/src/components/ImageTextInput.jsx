"use client";
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthDataContext } from "../context/AuthDataContext";

export default function ImageTextInput() {
  const navigate = useNavigate();
  const { serverUrl } = useContext(AuthDataContext);
  const [imageFile, setImageFile] = useState(null);
  const [extraText, setExtraText] = useState("");
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.warn("Geolocation error:", err);
          setError("Unable to get location. Please enable geolocation.");
        }
      );
    }
  }, []);

  const onFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setImageFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!coords) {
        setError("Location not available. Please enable geolocation.");
        setLoading(false);
        return;
      }

      if (!imageFile && !extraText.trim()) {
        setError("Please provide at least an image or description.");
        setLoading(false);
        return;
      }

      const form = new FormData();
      form.append("mode", "IMAGE_TEXT");
      form.append("description", extraText || "");
      form.append("latitude", String(coords.lat));
      form.append("longitude", String(coords.lng));
      form.append("severity", "Medium");

      if (imageFile) {
        form.append("image", imageFile);
      }

      console.log("Submitting IMAGE_TEXT incident...");
      const response = await axios.post(
        `${serverUrl || ""}/api/incident/create`,
        form,
        {
          withCredentials: true,
        }
      );

      setSuccess(true);
      setImageFile(null);
      setExtraText("");
      console.log("Incident created:", response.data);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Submit error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to submit incident"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center p-4 relative">
      {/* Top Right Navigation Button */}
      <button
        onClick={() => navigate("/sos")}
        className="absolute top-6 right-6 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-md transition-all duration-200 flex items-center gap-2"
      >
        <span className="text-lg">🚨</span>
        <span>SOS</span>
      </button>

      <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl p-8">
        <h1 className="text-4xl font-bold mb-2 text-blue-700">Report Incident</h1>
        <p className="text-gray-600 mb-8">Provide details about the emergency situation</p>

        {error && (
          <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-lg border-l-4 border-red-500">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 mb-6 text-green-700 bg-green-100 rounded-lg border-l-4 border-green-500">
            ✓ Incident reported successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-700">
              📷 Attach Image (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-100 file:text-blue-700
                hover:file:bg-blue-200 cursor-pointer"
            />
            {imageFile && (
              <div className="mt-4 flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="preview"
                  className="w-24 h-24 object-cover rounded-lg border-2 border-blue-300"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{imageFile.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:text-red-800 font-semibold mt-2"
                    onClick={() => setImageFile(null)}
                  >
                    ✕ Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-700">
              📝 Description (optional)
            </label>
            <textarea
              value={extraText}
              onChange={(e) => setExtraText(e.target.value)}
              className="w-full min-h-[120px] p-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              placeholder="Describe the incident in detail..."
            />
          </div>

          {/* Location Info */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border-2 border-green-200">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              📍 Location
            </label>
            {coords ? (
              <div className="text-sm text-gray-700 font-mono">
                <p>Latitude: {coords.lat.toFixed(6)}</p>
                <p>Longitude: {coords.lng.toFixed(6)}</p>
              </div>
            ) : (
              <div className="text-sm text-gray-500 animate-pulse">⏳ Getting location...</div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !coords}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 transform ${
              loading || !coords
                ? "bg-gray-400 cursor-not-allowed opacity-60"
                : "bg-blue-600 hover:bg-blue-700 active:scale-95"
            }`}
          >
            {loading ? "⏳ Submitting..." : "✓ Submit Incident Report"}
          </button>
        </form>
      </div>
    </div>
  );
}