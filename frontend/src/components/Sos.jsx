"use client";
import React, { useState, useRef, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthDataContext } from "../context/AuthDataContext";
import {
  Mic, Square, XCircle, MapPin, Loader2,
  ShieldAlert, CheckCircle2, Activity, ArrowRight
} from "lucide-react";

const SpeechRecognitionClass =
  typeof window !== "undefined" &&
  (window.webkitSpeechRecognition || window.SpeechRecognition);

export default function Sos() {
  const navigate = useNavigate();
  const { serverUrl } = useContext(AuthDataContext);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("Idle");
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const recognitionLangRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch { }
      try {
        mediaRecorderRef.current?.stop();
      } catch { }
    };
  }, []);

  const getCurrentPositionAsync = (opts = {}) =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation)
        return reject(new Error("Geolocation not supported"));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        (err) => reject(err),
        opts,
      );
    });

  const startRecording = async () => {
    setError(null);
    setTranscript("");
    finalTranscriptRef.current = "";
    recognitionLangRef.current = navigator.language || "en-US";

    try {
      const pos = await getCurrentPositionAsync({ timeout: 3000 });
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch (e) {
      console.warn("Geolocation (start) failed:", e);
    }

    if (SpeechRecognitionClass) {
      try {
        const Rec = SpeechRecognitionClass;
        const rec = new Rec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = recognitionLangRef.current;
        rec.onresult = (e) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            const t = r[0].transcript;
            if (r.isFinal)
              finalTranscriptRef.current = (
                finalTranscriptRef.current +
                " " +
                t
              ).trim();
            else interim += t;
          }
          setTranscript(
            (
              finalTranscriptRef.current + (interim ? " " + interim : "")
            ).trim(),
          );
        };
        rec.onerror = (e) => {
          console.warn("Speech error", e);
        };
        rec.onend = () => {
          // Do not auto-set listening to false here for continuous toggle logic, 
          // unless explicitly stopped by user or error.
        };
        recognitionRef.current = rec;
        try {
          rec.start();
        } catch (e) {
          console.warn("Recognition start error:", e);
        }
      } catch (err) {
        console.warn("Speech recognition init error:", err);
      }
    } else {
      console.warn("SpeechRecognition not supported in this browser");
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size) audioChunksRef.current.push(ev.data);
      };
      mr.start(250);
      mediaRecorderRef.current = mr;
    } catch (err) {
      console.error("Mic access error", err);
      setError("Microphone access denied");
      try {
        recognitionRef.current?.stop();
      } catch { }
      recognitionRef.current = null;
      return;
    }

    setIsListening(true);
    setStatus("Recording");
  };

  const stopRecording = async () => {
    setStatus("Processing");

    // Stop Speech Recognition
    try {
      recognitionRef.current?.stop();
    } catch { }
    recognitionRef.current = null;

    // Refresh GPS if needed
    if (!coords) {
      try {
        const pos = await getCurrentPositionAsync({ timeout: 5000 });
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch (e) {
        console.warn("Geolocation (stop) failed:", e);
      }
    }

    // Stop Media Recorder
    const mr = mediaRecorderRef.current;
    if (!mr) {
      setIsListening(false);
      setError("No recording in progress");
      setStatus("Idle");
      return;
    }

    // We need to wait for the final 'ondataavailable' event after stopping
    const stopPromise = new Promise(resolve => {
      mr.onstop = resolve;
    });

    try {
      if (mr.state !== "inactive") mr.stop();
    } catch (e) {
      console.warn(e);
    }

    await stopPromise;
    mediaRecorderRef.current = null;

    const chunks = audioChunksRef.current;
    audioChunksRef.current = [];

    if (!chunks || chunks.length === 0) {
      setIsListening(false);
      setError("No audio captured");
      setStatus("Idle");
      return;
    }
    const blob = new Blob(chunks, { type: "audio/webm" });

    setIsListening(false);

    // Transcribe
    setStatus("Transcribing");
    let groqTranscript = "";
    let groqRaw = null;
    try {
      const form = new FormData();
      form.append("file", blob, "sos.webm");
      form.append("model", "whisper-large-v3");
      form.append(
        "language",
        recognitionLangRef.current || navigator.language || "auto",
      );
      form.append("translate", "false");

      const groqKey = import.meta.env.VITE_GROQ_API;
      if (groqKey) {
        const resp = await fetch(
          "https://api.groq.com/openai/v1/audio/transcriptions",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${groqKey}` },
            body: form,
          },
        );
        groqRaw = await resp.json();
        groqTranscript = groqRaw?.text || "";
      } else {
        console.warn("No VITE_GROQ_API key found");
      }
    } catch (err) {
      console.error("Groq transcription error:", err);
      // Fallback to browser transcript if Groq fails
    }

    const finalTranscript =
      groqTranscript && groqTranscript.trim()
        ? groqTranscript.trim()
        : finalTranscriptRef.current.trim() || transcript.trim();

    if (!finalTranscript) {
      setError("No transcribed text available");
      setStatus("Idle");
      return;
    }

    setStatus("Sending");
    try {
      const payload = {
        mode: "VOICE",
        transcript: finalTranscript,
        description: finalTranscript,
        latitude: coords?.lat,
        longitude: coords?.lng,
        severity: "Medium",
        language: recognitionLangRef.current || navigator.language || "und",
        groqRawResponse: groqRaw,
      };

      await axios.post(`${serverUrl || ""}/api/incident/create`, payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      setStatus("Sent");
      setError(null);
      setTranscript(finalTranscript);

      // Auto-reset after a delay
      setTimeout(() => {
        setStatus("Idle");
        setTranscript("");
        setCoords(null);
        finalTranscriptRef.current = "";
      }, 5000);

    } catch (err) {
      console.error("Create incident error:", err);
      setError(err?.response?.data?.message || "Failed to register incident");
      setStatus("Idle");
    }
  };

  const handleToggleRecording = () => {
    if (status === "Idle" || status === "Sent" || status === "Error") {
      startRecording();
    } else if (status === "Recording") {
      stopRecording();
    }
  };

  // UI Helpers
  const getStatusColor = (s) => {
    switch (s) {
      case "Recording": return "bg-red-500";
      case "Processing": return "bg-blue-500";
      case "Transcribing": return "bg-indigo-500";
      case "Sending": return "bg-purple-500";
      case "Sent": return "bg-green-500";
      case "Idle": default: return "bg-zinc-200";
    }
  };

  const getStatusIcon = (s) => {
    switch (s) {
      case "Recording": return <Activity className="animate-pulse text-red-500" />;
      case "Processing":
      case "Transcribing":
      case "Sending": return <Loader2 className="animate-spin text-blue-500" />;
      case "Sent": return <CheckCircle2 className="text-green-500" />;
      default: return <Mic className="text-zinc-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 pt-20 px-6 pb-12 flex flex-col items-center justify-center font-sans relative">

      {/* Navigation Button */}
      <button
        onClick={() => navigate("/imagetext")}
        className="absolute top-24 right-6 md:top-28 md:right-10 bg-white hover:bg-zinc-50 text-zinc-700 px-2 md:px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm border border-zinc-200 transition-all flex items-center gap-2 z-10"
      >
        <span>Image Report</span>
        <ArrowRight size={16} className="text-blue-600" />
      </button>

      {/* Main SOS Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-zinc-100 relative">

        {/* Status Bar */}
        <div className={`h-1.5 w-full transition-all duration-500 ${getStatusColor(status)}`} />

        <div className="p-8 flex flex-col items-center text-center">

          {/* Header */}
          <div className="mb-8 space-y-1">
            <div className="flex items-center justify-center gap-2 text-red-600 font-bold tracking-wider uppercase text-xs">
              <ShieldAlert size={14} /> Emergency SOS Mode
            </div>
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
              {status === "Sent" ? "Alert Dispatched" : "Voice Alert"}
            </h1>
            <p className="text-zinc-500 text-sm">
              {status === "Idle" || status === "Sent" ? "Tap to record your emergency" : "Tap again to send alert"}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 w-full bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <XCircle size={18} />
              <span className="flex-1 text-left">{error}</span>
            </div>
          )}

          {/* THE BIG TOGGLE BUTTON */}
          <div className="relative mb-10 group select-none">

            {/* Pulse Rings for Recording State */}
            {isListening && (
              <>
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                <div className="absolute -inset-4 bg-red-500 rounded-full animate-pulse opacity-10"></div>
              </>
            )}

            <button
              onClick={handleToggleRecording}
              disabled={status === "Processing" || status === "Transcribing" || status === "Sending"}
              className={`
                    relative w-48 h-48 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-200 ease-in-out
                    ${isListening
                  ? "bg-white border-4 border-red-500 text-red-600 scale-95 shadow-red-200"
                  : "bg-gradient-to-br from-red-500 to-red-600 text-white hover:scale-105 hover:shadow-red-200 active:scale-95"
                }
                    ${status === "Sent" ? "!bg-green-500 !from-green-500 !to-green-600 !border-0 text-white" : ""}
                    ${(status === "Processing" || status === "Transcribing" || status === "Sending") ? "opacity-80 cursor-not-allowed scale-100" : ""}
                `}
            >
              {status === "Sent" ? (
                <>
                  <CheckCircle2 size={56} className="mb-2 animate-bounce" />
                  <span className="font-bold text-lg">SENT</span>
                </>
              ) : isListening ? (
                <>
                  <Square size={40} fill="currentColor" className="mb-2 animate-pulse" />
                  <span className="font-bold text-sm tracking-widest">STOP</span>
                  <span className="text-xs mt-1 font-mono text-red-400">Recording...</span>
                </>
              ) : (status === "Processing" || status === "Transcribing" || status === "Sending") ? (
                <>
                  <Loader2 size={48} className="animate-spin mb-2 text-blue-500" />
                  <span className="font-bold text-sm text-zinc-500">SENDING...</span>
                </>
              ) : (
                <>
                  <Mic size={48} className="mb-2" />
                  <span className="font-bold text-lg tracking-widest">TAP TO<br />RECORD</span>
                </>
              )}
            </button>
          </div>

          {/* Status Badge */}
          <div className="mb-6 flex items-center gap-3 bg-zinc-50 border border-zinc-100 py-2 px-4 rounded-full">
            {getStatusIcon(status)}
            <span className="text-sm font-semibold text-zinc-600 uppercase tracking-wide min-w-[80px] text-left">
              {status}
            </span>
          </div>

          {/* Transcript Area */}
          <div className="w-full bg-zinc-50 rounded-2xl border border-zinc-100 p-5 text-left transition-all">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Live Transcript</p>
              {transcript && status === "Recording" && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
            </div>
            <textarea
              readOnly
              value={transcript || (isListening ? "Listening..." : "Ready to record.")}
              className="w-full min-h-[80px] bg-transparent resize-none outline-none text-zinc-700 text-sm leading-relaxed placeholder:text-zinc-300 font-medium"
            />
          </div>

          {/* Footer - GPS */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-400 font-medium bg-white border border-zinc-100 py-1.5 px-3 rounded-lg shadow-sm">
            <MapPin size={12} className={coords ? "text-green-500" : "text-zinc-300"} />
            {coords ? (
              <span className="font-mono">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
            ) : (
              <span>Waiting for GPS...</span>
            )}
          </div>

        </div>
      </div>

      <p className="mt-8 text-center text-zinc-400 text-xs max-w-xs">
        Tap once to start recording. Tap again to stop and automatically send the alert to nearby responders.
      </p>

    </div>
  );
}