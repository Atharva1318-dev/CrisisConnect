import React, { useEffect, useState } from "react";
import axios from "axios";

// 🔥 CORRECT BACKEND PORT
const API = "http://localhost:8901/api/incident";

const Agency = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/list`);
      
      console.log("RAW INCIDENTS:", res.data.incidents);

      const pending = res.data.incidents
        .filter((i) => i.status === "Pending")
        .sort((a, b) => b.trustScore - a.trustScore);

      setIncidents(pending);
      if (pending.length > 0 && !selectedIncident) {
        setSelectedIncident(pending[0]);
      }
    } catch (err) {
      console.error("Fetch incidents error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const acceptIncident = async (id) => {
    await axios.patch(
      `${API}/${id}/status`,
      { status: "Active" },
      { withCredentials: true }
    );
    fetchIncidents();
  };

  const rejectIncident = async (id) => {
    await axios.patch(
      `${API}/${id}/mark-spam`,
      {},
      { withCredentials: true }
    );
    fetchIncidents();
  };

  const getSeverityColor = (severity) => {
    switch(severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTypeIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'fire': return '🔥';
      case 'medical': return '🚑';
      case 'police': return '🚨';
      case 'accident': return '🚧';
      case 'natural disaster': return '🌪️';
      default: return '⚠️';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Outer container with proper spacing */}
      <div className="min-h-screen flex flex-col">
        {/* Header - Not fixed, but with proper spacing */}
        <header className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <span className="text-xl">🚨</span>
                  </div>
                  Agency Triage Dashboard
                </h1>
                <p className="text-gray-600 text-sm mt-1">Monitor and manage incoming emergency incidents</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                  <div className="text-xs text-gray-500">Pending</div>
                  <div className="text-xl font-bold text-gray-900">{incidents.length}</div>
                </div>
                <button 
                  onClick={fetchIncidents}
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-200 shadow-sm transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area - Takes remaining space */}
        <div className="flex-1 flex p-6 gap-6">
          {/* LEFT PANEL - Incident Queue - Scrollable */}
          <div className="w-[40%] flex flex-col">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full">
              <div className="p-6 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Triage Queue</h2>
                    <p className="text-gray-600 mt-1">Review and prioritize incoming incidents</p>
                  </div>
                  <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    {incidents.length} pending
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-gray-500 text-lg">Loading incidents...</p>
                    </div>
                  ) : incidents.length === 0 ? (
                    <div className="text-center py-24">
                      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">🎉</span>
                      </div>
                      <h3 className="text-xl font-semibold text-green-700 mb-3">All Clear!</h3>
                      <p className="text-gray-600 text-lg">No pending incidents at the moment</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {incidents.map((incident) => (
                        <div
                          key={incident._id}
                          onClick={() => setSelectedIncident(incident)}
                          className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-lg ${
                            selectedIncident?._id === incident._id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-xl ${getSeverityColor(incident.severity)}`}>
                                <span className="text-2xl">{getTypeIcon(incident.type)}</span>
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 text-lg">{incident.type}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getSeverityColor(incident.severity)}`}>
                                    {incident.severity}
                                  </span>
                                  <span className="text-sm text-gray-500">•</span>
                                  <span className="text-sm text-gray-500 capitalize">{incident.mode.toLowerCase()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500 mb-1">Trust Score</div>
                              <div className="px-4 py-2 bg-gray-100 rounded-lg">
                                <span className="font-bold text-gray-900 text-xl">{incident.trustScore}</span>
                                <span className="text-gray-500">/100</span>
                              </div>
                            </div>
                          </div>

                          {incident.mode === "VOICE" && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-xl text-gray-700 line-clamp-3">
                              <p className="text-sm">{incident.transcript}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-6">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-500">
                                {new Date(incident.createdAt).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                              <span className="text-sm text-green-600 font-medium">Live</span>
                            </div>
                            <div className="flex gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  acceptIncident(incident._id);
                                }}
                                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2 shadow-sm"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Accept
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  rejectIncident(incident._id);
                                }}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2 shadow-sm"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - Map and Details */}
          <div className="w-[60%] flex flex-col gap-6">
            {/* HUGE Map Section */}
            <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <span className="text-3xl">🗺️</span>
                      Tactical Operations Map
                    </h2>
                    <p className="text-gray-600 mt-1">Live incident locations and resource deployment</p>
                  </div>
                  <div className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-xl text-sm font-medium border border-indigo-200">
                    Real-time Tracking
                  </div>
                </div>
              </div>
              <div className="p-6 h-[calc(100%-100px)] overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="h-full flex flex-col items-center justify-center">
                  {selectedIncident ? (
                    <>
                      <div className="relative mb-8">
                        <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center mx-auto shadow-2xl border-8 border-blue-100">
                          <span className="text-6xl">📍</span>
                        </div>
                        <div className="absolute top-6 right-6 w-12 h-12 bg-red-500 rounded-full animate-ping border-4 border-white"></div>
                        <div className="absolute -top-4 -left-4 w-32 h-32 bg-blue-200 rounded-full opacity-20"></div>
                        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-indigo-200 rounded-full opacity-20"></div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        {selectedIncident.type} Incident Location
                      </h3>
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                          <div className="text-sm text-gray-500 mb-1">Coordinates</div>
                          <div className="text-lg font-semibold text-gray-900">40.7128° N, 74.0060° W</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                          <div className="text-sm text-gray-500 mb-1">Distance</div>
                          <div className="text-lg font-semibold text-gray-900">2.3km from station</div>
                        </div>
                      </div>
                      <div className="w-3/4 h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
                    </>
                  ) : (
                    <>
                      <div className="relative mb-8">
                        <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center mx-auto shadow-2xl border-8 border-blue-100">
                          <span className="text-6xl">🌍</span>
                        </div>
                        <div className="absolute -top-4 -left-4 w-32 h-32 bg-blue-200 rounded-full opacity-20"></div>
                        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-indigo-200 rounded-full opacity-20"></div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Interactive Map View</h3>
                      <p className="text-gray-600 text-lg max-w-xl text-center mb-6">
                        Select an incident from the queue to view its precise location and surrounding emergency resources
                      </p>
                      <div className="flex items-center gap-4 text-gray-500">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span>Critical Incidents</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span>Response Teams</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span>Hospitals</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* HUGE Incident Details Section */}
            <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Incident Analysis</h2>
                    <p className="text-gray-600 mt-1">Detailed information and response recommendations</p>
                  </div>
                  {selectedIncident && (
                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-2 rounded-xl text-sm font-medium ${getSeverityColor(selectedIncident.severity)}`}>
                        {selectedIncident.severity}
                      </span>
                      <div className="px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                        <span className="font-bold text-gray-900 text-xl">{selectedIncident.trustScore}</span>
                        <span className="text-gray-500">/100</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 h-[calc(100%-100px)] overflow-y-auto">
                {selectedIncident ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500 mb-2 block">Incident Details</label>
                          <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-lg ${getSeverityColor(selectedIncident.severity)}`}>
                                <span className="text-3xl">{getTypeIcon(selectedIncident.type)}</span>
                              </div>
                              <div>
                                <p className="text-xl font-bold text-gray-900">{selectedIncident.type}</p>
                                <p className="text-gray-600">{selectedIncident.mode} Report</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {selectedIncident.mode === "VOICE" && selectedIncident.transcript && (
                          <div>
                            <label className="text-sm font-medium text-gray-500 mb-2 block">Voice Transcript</label>
                            <div className="p-4 bg-gray-50 rounded-xl">
                              <p className="text-gray-700">{selectedIncident.transcript}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500 mb-2 block">Timeline & Status</label>
                          <div className="space-y-3">
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                              <div className="text-sm text-blue-700 font-medium mb-1">Reported</div>
                              <div className="text-lg text-gray-900">
                                {new Date(selectedIncident.createdAt).toLocaleString()}
                              </div>
                            </div>
                            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                              <div className="text-sm text-yellow-700 font-medium mb-1">Current Status</div>
                              <div className="text-lg font-medium text-yellow-800">Pending Triage</div>
                            </div>
                          </div>
                        </div>

                        {selectedIncident.imageUrl && (
                          <div>
                            <label className="text-sm font-medium text-gray-500 mb-2 block">Evidence</label>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                              <img
                                src={selectedIncident.imageUrl}
                                alt="Incident evidence"
                                className="rounded-lg w-full h-48 object-cover"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedIncident.translatedTranscript && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-2 block">Translated Content</label>
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                          <p className="text-gray-700">{selectedIncident.translatedTranscript}</p>
                        </div>
                      </div>
                    )}

                    <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
                      <button
                        onClick={() => rejectIncident(selectedIncident._id)}
                        className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 text-base font-medium rounded-xl transition-all flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Mark as Spam
                      </button>
                      <button
                        onClick={() => acceptIncident(selectedIncident._id)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-base font-medium rounded-xl transition-all flex items-center gap-2 shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Activate & Deploy Response
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">📋</span>
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Incident Selected</h3>
                      <p className="text-gray-600 text-lg max-w-xl mb-6">
                        Select an incident from the queue to view detailed analysis, location data, and response recommendations.
                      </p>
                      <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-50 text-blue-700 rounded-xl">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm">Click on any incident card to view details</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              Emergency Response System v2.1 • Secure Connection • Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                System Active
              </span>
              <span>•</span>
              <span>{incidents.length} incidents in queue</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Agency;