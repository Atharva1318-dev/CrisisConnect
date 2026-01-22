"use client";
import React, { useState, useRef, useEffect, useContext } from "react";
import axios from "axios";
import { AuthDataContext } from "../context/AuthDataContext";

const SpeechRecognition =
  typeof window !== "undefined" &&
  (window.webkitSpeechRecognition || window.SpeechRecognition);

export default function Sos() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("Idle"); // Idle, Sending, Sent
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const { serverUrl } = useContext(AuthDataContext);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onend = null;
        } catch {}
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const startRecording = () => {
    // Check browser support
    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    setError(null);
    setTranscript("");

    // Capture GPS coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn("Geolocation error:", err.message);
          setError("Unable to access GPS. Please enable location services.");
          setCoords(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError("Geolocation not supported in this browser.");
      setCoords(null);
    }

    // Initialize speech recognition
    const Rec = SpeechRecognition;
    const rec = new Rec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => {
      console.log("Speech recognition started");
    };

    rec.onresult = (e) => {
      let finalText = "";
      let interimText = "";

      // Process all results
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript_text = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalText += transcript_text + " ";
        } else {
          interimText += transcript_text;
        }
      }

      // Update transcript state
      setTranscript((prev) => {
        const base = (prev || "").trim();
        const withFinal = finalText ? (base + " " + finalText).trim() : base;
        return interimText ? (withFinal + " " + interimText).trim() : withFinal;
      });
    };

    rec.onerror = (e) => {
      console.error("Speech recognition error:", e.error);
      if (e.error !== "no-speech") {
        setError(`Speech error: ${e.error}`);
      }
    };

    rec.onend = () => {
      console.log("Speech recognition ended");
      setIsListening(false);
    };

    recognitionRef.current = rec;

    try {
      rec.start();
      setIsListening(true);
      setStatus("Idle");
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setError("Failed to start speech recognition");
    }
  };

  const stopRecording = async () => {
    // Stop recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("Error stopping recognition:", err);
      }
      recognitionRef.current = null;
    }

    setIsListening(false);

    // Validate transcript
    const rawText = (transcript || "").trim();
    if (!rawText) {
      setError("No speech detected. Please try again.");
      return;
    }

    // Validate coordinates
    if (!coords) {
      setError("GPS location not available. Please enable location access.");
      return;
    }

    // Prepare payload
    const payload = {
      rawText,
      gpsCoordinates: coords,
      timestamp: new Date().toISOString(),
    };

    // Send to backend
    setStatus("Sending");
    try {
      const response = await axios.post(
        `${serverUrl}/api/create-incident`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      console.log("Incident created successfully:", response.data);

      setStatus("Sent");
      setError(null);

      // Reset after 3 seconds
      setTimeout(() => {
        setStatus("Idle");
        setTranscript("");
        setCoords(null);
      }, 3000);
    } catch (err) {
      console.error("Failed to send incident:", err);
      const errorMessage =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to send SOS alert";
      setError(errorMessage);
      setStatus("Idle");
    }
  };

  // Event handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    startRecording();
  };

  const handleMouseUp = (e) => {
    e.preventDefault();
    stopRecording();
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    startRecording();
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    stopRecording();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Page Title */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
          Emergency SOS Alert
        </h1>
        <p className="text-gray-600 text-lg">
          Press and hold the button, then speak to report an emergency
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="w-full max-w-2xl mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded text-red-700 animate-pulse">
          <p className="font-semibold">⚠️ Alert</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* SOS Button Container */}
      <div className="relative mb-12">
        {/* Outer pulse ring */}
        <span
          className={`absolute inset-0 rounded-full bg-red-500 opacity-40 ${
            isListening ? "animate-ping" : "opacity-0"
          }`}
        />

        {/* Middle pulse ring */}
        <span
          className={`absolute inset-3 rounded-full bg-red-500 opacity-30 ${
            isListening ? "animate-pulse" : "opacity-0"
          }`}
        />

        {/* Main Button */}
        <button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          aria-pressed={isListening}
          aria-label="SOS Emergency Button"
          className="relative z-10 w-40 h-40 md:w-56 md:h-56 rounded-full bg-gradient-to-b from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-2xl flex items-center justify-center text-white text-3xl md:text-5xl font-bold select-none active:scale-95 transform transition-transform duration-150"
        >
          SOS
        </button>
      </div>

      {/* Status Grid */}
      <div className="w-full max-w-2xl grid grid-cols-3 gap-4 mb-8">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-xs text-gray-600 font-semibold mb-1">STATUS</p>
          <p className="text-lg font-bold text-gray-900">
            {status === "Sent" ? "✅ Sent" : status}
          </p>
        </div>

        {/* Listening Card */}
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-xs text-gray-600 font-semibold mb-1">LISTENING</p>
          <p
            className={`text-lg font-bold ${
              isListening ? "text-red-600 animate-pulse" : "text-gray-600"
            }`}
          >
            {isListening ? "🔴 ON" : "⚪ OFF"}
          </p>
        </div>

        {/* GPS Card */}
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-xs text-gray-600 font-semibold mb-1">GPS</p>
          <p
            className={`text-lg font-bold ${
              coords ? "text-green-600" : "text-gray-600"
            }`}
          >
            {coords ? "✓ Ready" : "✗ Waiting"}
          </p>
        </div>
      </div>

      {/* Transcript Box */}
      <div className="w-full max-w-2xl mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          📝 Live Transcript
        </label>
        <textarea
          readOnly
          value={transcript}
          placeholder="Press and hold the SOS button and speak..."
          className="w-full min-h-[120px] p-4 border-2 border-gray-300 rounded-lg resize-none bg-white focus:border-red-500 focus:outline-none font-mono text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          {transcript.length} characters · {transcript.split(/\s+/).filter(Boolean).length} words
        </p>
      </div>

      {/* GPS Coordinates Display */}
      {coords && (
        <div className="w-full max-w-2xl p-4 bg-blue-50 border-l-4 border-blue-500 rounded mb-6">
          <p className="text-xs text-blue-600 font-bold mb-2">📍 GPS Location</p>
          <p className="text-sm text-blue-800 font-mono">
            <span className="font-semibold">Lat:</span> {coords.lat.toFixed(6)} | 
            <span className="font-semibold"> Lng:</span> {coords.lng.toFixed(6)}
          </p>
        </div>
      )}

      {/* Success Message */}
      {status === "Sent" && (
        <div className="w-full max-w-2xl p-4 bg-green-50 border-l-4 border-green-500 rounded mb-6 animate-bounce">
          <p className="text-lg font-bold text-green-700">
            ✅ Help Dispatched Successfully
          </p>
          <p className="text-sm text-green-600 mt-1">
            Emergency services have been notified with your location and message.
          </p>
        </div>
      )}

      {/* Footer Info */}
      <div className="w-full max-w-2xl text-center text-xs text-gray-500 mt-8 border-t pt-6">
        <p className="mb-2">
          🔒 Your data is encrypted and sent securely to emergency services
        </p>
        <p>Stay calm. Professional help is on the way.</p>
      </div>
    </div>
  );
}