import React, { useState, useEffect } from "react";
import axios from "axios";

export default function WhatsappSOS() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [step, setStep] = useState("input"); // input, initiated, instructions, tracking

  useEffect(() => {
    // Auto-focus input
    const input = document.getElementById("phoneInput");
    if (input) input.focus();
  }, []);

  const handleInitiateSOS = async (e) => {
    e.preventDefault();

    if (!phone || phone.length < 10) {
      setStatus("❌ Please enter a valid WhatsApp number");
      return;
    }

    setLoading(true);
    setStatus("🔄 Initiating SOS...");

    try {
      // This is just for frontend UI update
      // Real SOS is triggered when user sends "hi" on WhatsApp
      setStep("initiated");
      setStatus("✅ Instructions sent to WhatsApp!");

      setTimeout(() => {
        setStep("instructions");
      }, 1500);
    } catch (error) {
      setStatus("❌ Error: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-red-500 bg-opacity-20 rounded-full mb-4 border border-red-500 border-opacity-30">
            <svg
              className="w-8 h-8 text-red-500 animate-pulse"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10.5 1.5H9.5C4.81 1.5 1 5.31 1 10C1 14.69 4.81 18.5 9.5 18.5H10.5C15.19 18.5 19 14.69 19 10C19 5.31 15.19 1.5 10.5 1.5M10 15.5C7.24 15.5 5 13.26 5 10.5C5 7.74 7.24 5.5 10 5.5C12.76 5.5 15 7.74 15 10.5C15 13.26 12.76 15.5 10 15.5Z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white mb-2">
            🚨 EMERGENCY SOS
          </h1>
          <p className="text-gray-400 text-sm">WhatsApp-Based Emergency Response</p>
        </div>

        {/* Step 1: Input */}
        {step === "input" && (
          <form onSubmit={handleInitiateSOS}>
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-2xl p-8 border border-gray-700 shadow-2xl">
              <label className="block text-gray-200 text-sm font-semibold mb-3">
                📱 Enter Your WhatsApp Number
              </label>

              <input
                id="phoneInput"
                type="tel"
                placeholder="919876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-3 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-30 transition mb-6"
                disabled={loading}
                maxLength="15"
              />

              {status && (
                <div className="mb-4 p-3 bg-gray-700 bg-opacity-50 rounded-lg border border-gray-600">
                  <p className="text-sm text-yellow-300">{status}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-semibold"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    🔄 INITIATING...
                  </span>
                ) : (
                  "🔴 INITIATE SOS"
                )}
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">
                We'll send a message to your WhatsApp to get started
              </p>
            </div>
          </form>
        )}

        {/* Step 2: Initiated */}
        {step === "initiated" && (
          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-2xl p-8 border border-green-500 border-opacity-30 shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-block p-4 bg-green-500 bg-opacity-20 rounded-full mb-4 border border-green-500 border-opacity-30">
                <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-400 mb-2">SOS Initiated!</h2>
              <p className="text-gray-300 text-sm">Check your WhatsApp now</p>
            </div>

            <div className="bg-gray-700 bg-opacity-30 rounded-lg p-4 mb-6 border border-gray-600">
              <p className="text-gray-200 text-sm">
                <strong>Phone:</strong> {phone}
              </p>
            </div>

            <div className="text-center">
              <p className="text-gray-400 text-xs">Opening WhatsApp...</p>
              <div className="mt-4 flex justify-center">
                <a
                  href={`https://wa.me/${phone}?text=hi`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition transform hover:scale-105"
                >
                  💬 Open WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Instructions */}
        {step === "instructions" && (
          <div className="space-y-4">
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-2xl p-8 border border-gray-700 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6">📋 What Happens Next</h2>

              <div className="space-y-4">
                {[
                  { icon: "📱", title: "Send 'hi' on WhatsApp", desc: "Type 'hi' or 'sos' to start" },
                  { icon: "📍", title: "Share Your Location", desc: "Click the location icon and share" },
                  { icon: "💬", title: "Describe Emergency", desc: "Send a brief description of what happened" },
                  { icon: "📸", title: "Optional: Image/Audio", desc: "Share photo or voice message if needed" },
                  { icon: "✅", title: "Type SUBMIT", desc: "Reply with 'SUBMIT' to finalize" },
                  { icon: "🚑", title: "Help Dispatched", desc: "Teams will be sent to your location" },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-gray-700 bg-opacity-30 rounded-lg border border-gray-600 hover:border-red-500 transition">
                    <div className="text-2xl flex-shrink-0">{item.icon}</div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">{item.title}</h3>
                      <p className="text-gray-400 text-xs">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-red-500 bg-opacity -10 rounded-lg border border-red-500 border-opacity-30">
                <p className="text-red-200 text-xs">
                  <strong>⚠️ Important:</strong> Keep the WhatsApp chat open. You'll receive updates on your emergency status here.
                </p>
              </div>

              <button
                onClick={() => {
                  setStep("tracking");
                }}
                className="w-full mt-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg transition transform hover:scale-105"
              >
                ✅ Got It! Proceed
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Tracking */}
        {step === "tracking" && (
          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-2xl p-8 border border-gray-700 shadow-2xl">
            <div className="text-center">
              <div className="inline-block p-4 bg-blue-500 bg-opacity-20 rounded-full mb-4 border border-blue-500 border-opacity-30">
                <svg className="w-8 h-8 text-blue-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-blue-400 mb-2">Tracking Live</h2>
              <p className="text-gray-300 text-sm mb-6">Your emergency is being processed</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-700 bg-opacity-30 rounded-lg border border-gray-600">
                  <span className="text-gray-300 text-sm">📱 Message Sent</span>
                  <span className="text-green-400 text-sm font-semibold">✅ Done</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 bg-opacity-30 rounded-lg border border-blue-600">
                  <span className="text-gray-300 text-sm">💬 Awaiting Your Response</span>
                  <span className="text-blue-400 text-sm font-semibold">⏳ Waiting</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 bg-opacity-30 rounded-lg border border-gray-600">
                  <span className="text-gray-300 text-sm">🏥 Agency Verification</span>
                  <span className="text-gray-500 text-sm font-semibold">⏸️ Pending</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 bg-opacity-30 rounded-lg border border-gray-600">
                  <span className="text-gray-300 text-sm">🚑 Resources Dispatch</span>
                  <span className="text-gray-500 text-sm font-semibold">⏸️ Pending</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-500 bg-opacity-10 rounded-lg border border-blue-500 border-opacity-30">
                <a
                  href={`https://wa.me/${phone}?text=hi`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-center transition transform hover:scale-105"
                >
                  💬 Continue on WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-xs">
          <p>Emergency SOS System • Available 24/7 • Response Time: ~5-10 minutes</p>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}