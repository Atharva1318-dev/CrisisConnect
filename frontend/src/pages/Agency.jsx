import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { AuthDataContext } from "../context/AuthDataContext";
import {
  MapContainer,
  TileLayer,
  Popup,
  Marker,
  LayersControl,
  useMap,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import MarkerClusterGroup from "react-leaflet-markercluster";
import L from "leaflet";

// ✅ MARKER ICONS
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import greenflag from "../assets/greenflag.png";
import redflag from "../assets/redflag.png";
import yellowflag from "../assets/yellowflag.png";

// ✅ FIX LEAFLET ICONS
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ✅ INCIDENT ICON
const getStatusIcon = (status) => {
  let iconUrl = greenflag;
  let size = [40, 50];

  switch (status) {
    case "Active":
      iconUrl = greenflag;
      break;
    case "Pending":
      iconUrl = yellowflag;
      break;
    case "Spam":
      iconUrl = redflag;
      break;
    case "Resolved":
      iconUrl = greenflag;
      break;
    default:
      iconUrl = greenflag;
  }

  return L.icon({
    iconUrl: iconUrl,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1]],
    shadowUrl: null,
  });
};

// ✅ RESOURCE ICON (COLORED BY CATEGORY)
const getResourceIcon = (category) => {
  const categoryMap = {
    medical: { emoji: "🏥", color: "#ef4444" },
    food: { emoji: "🍖", color: "#f59e0b" },
    equipment: { emoji: "🔧", color: "#8b5cf6" },
    shelter: { emoji: "🏠", color: "#10b981" },
    rescue: { emoji: "🚑", color: "#dc2626" },
    water: { emoji: "💧", color: "#06b6d4" },
    fuel: { emoji: "⛽", color: "#f97316" },
  };

  const categoryLower = category?.toLowerCase();
  const { emoji = "📦", color = "#3b82f6" } = categoryMap[categoryLower] || {};

  return L.divIcon({
    html: `<div style="background: linear-gradient(135deg, ${color} 0%, ${adjustBrightness(
      color,
      -20
    )} 100%); border-radius: 50%; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-size: 22px;">${emoji}</div>`,
    className: "resource-icon",
    iconSize: [45, 45],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
};

// ✅ CLUSTER ICON
const createCustomClusterIcon = (cluster) => {
  const count = cluster.getChildCount();
  let bgColor = "#3b82f6";
  let scale = 1;

  if (count > 10) {
    bgColor = "#dc2626";
    scale = 1.3;
  } else if (count > 5) {
    bgColor = "#f59e0b";
    scale = 1.15;
  }

  return L.divIcon({
    html: `<div style="background: linear-gradient(135deg, ${bgColor} 0%, ${adjustBrightness(
      bgColor,
      -20
    )} 100%); border-radius: 50%; width: ${40 * scale}px; height: ${
      40 * scale
    }px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: ${
      14 * scale
    }px; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">${count}</div>`,
    className: "custom-cluster-icon",
    iconSize: [40 * scale, 40 * scale],
    iconAnchor: [(40 * scale) / 2, (40 * scale) / 2],
  });
};

// ✅ ADJUST COLOR BRIGHTNESS
const adjustBrightness = (color, percent) => {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
};

// ✅ MAP CONTROLLER - PREVENTS ZOOM ISSUES
function MapController({ incidents, resources }) {
  const map = useMap();
  const hasSetBounds = useRef(false);

  useEffect(() => {
    if (!hasSetBounds.current && (incidents?.length > 0 || resources?.length > 0)) {
      const allCoords = [];

      incidents?.forEach((inc) => {
        if (inc.location?.coordinates?.[0] && inc.location?.coordinates?.[1]) {
          allCoords.push([
            inc.location.coordinates[1],
            inc.location.coordinates[0],
          ]);
        }
      });

      resources?.forEach((res) => {
        if (res.location?.coordinates?.[0] && res.location?.coordinates?.[1]) {
          allCoords.push([
            res.location.coordinates[1],
            res.location.coordinates[0],
          ]);
        }
      });

      if (allCoords.length > 1) {
        try {
          const bounds = L.latLngBounds(allCoords);
          map.fitBounds(bounds, {
            padding: [100, 100],
            maxZoom: 16,
            animate: true,
          });
          hasSetBounds.current = true;
        } catch (err) {
          console.error("Bounds error:", err);
        }
      } else if (allCoords.length === 1) {
        map.setView(allCoords[0], 15);
        hasSetBounds.current = true;
      }
    }
  }, []);

  return null;
}

// ✅ TACTICAL MAP WITH INCIDENTS & RESOURCES
const TacticalMap = ({ incidents, resources }) => {
  const defaultCenter = [19.0760, 72.8777];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      scrollWheelZoom={true}
      dragging={true}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
    >
      <LayersControl position="topright" collapsed={false}>
        {/* BASE LAYERS */}
        <LayersControl.BaseLayer checked name="🗺️ Standard">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="🌙 Dark">
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="🛰️ Satellite">
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>

        {/* INCIDENTS LAYER */}
        <LayersControl.Overlay checked name="🚨 Incidents">
          <MarkerClusterGroup
            iconCreateFunction={createCustomClusterIcon}
            maxClusterRadius={50}
            disableClusteringAtZoom={16}
          >
            {incidents?.map((incident) => {
              if (!incident.location?.coordinates?.[0]) return null;

              const [lon, lat] = incident.location.coordinates;
              return (
                <Marker
                  key={incident._id}
                  position={[lat, lon]}
                  icon={getStatusIcon(incident.status)}
                >
                  <Popup maxWidth={300} minWidth={250}>
                    <div className="text-sm space-y-2">
                      <div className="font-bold text-red-600 text-base">
                        🚨 {incident.type}
                      </div>
                      <div className="border-t border-gray-300 pt-2 space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">
                            Status:
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              incident.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : incident.status === "Pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {incident.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">
                            Severity:
                          </span>
                          <span className="font-bold text-red-600">
                            {incident.severity}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">
                            Trust:
                          </span>
                          <span className="font-bold text-blue-600">
                            {typeof incident.trustScore === "object"
                              ? incident.trustScore.totalScore || "N/A"
                              : incident.trustScore || "N/A"}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </LayersControl.Overlay>

        {/* RESOURCES LAYER */}
        <LayersControl.Overlay checked name="📦 Resources">
          <MarkerClusterGroup
            iconCreateFunction={createCustomClusterIcon}
            maxClusterRadius={50}
            disableClusteringAtZoom={15}
          >
            {resources?.map((resource) => {
              if (!resource.location?.coordinates?.[0]) return null;

              const [lon, lat] = resource.location.coordinates;
              return (
                <Marker
                  key={resource._id}
                  position={[lat, lon]}
                  icon={getResourceIcon(resource.category)}
                >
                  <Popup maxWidth={300} minWidth={260}>
                    <div className="text-sm space-y-2">
                      <div className="font-bold text-blue-600 text-base">
                        📦 {resource.category}
                      </div>
                      <div className="border-t border-gray-300 pt-2 space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">
                            Item:
                          </span>
                          <span className="font-bold text-gray-900">
                            {resource.item_name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">
                            Qty:
                          </span>
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold text-xs">
                            ×{resource.quantity}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">
                            Status:
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              resource.status === "Available"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {resource.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          Owner: {resource.owner?.name || "Unknown"}
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </LayersControl.Overlay>
      </LayersControl>

      <MapController incidents={incidents} resources={resources} />
    </MapContainer>
  );
};

// ✅ MAIN AGENCY COMPONENT
const Agency = () => {
  const { serverUrl } = useContext(AuthDataContext);

  const [coordinators, setCoordinators] = useState([]);
  const [selectedCoordinator, setSelectedCoordinator] = useState(null);
  const [step, setStep] = useState(1);

  const [allIncidents, setAllIncidents] = useState([]);
  const [pendingIncidents, setPendingIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchResources, setDispatchResources] = useState([]);

  const [sentRequests, setSentRequests] = useState([]);
  const [availableResources, setAvailableResources] = useState([]);

  const severityPreset = {
    Low: 1,
    Medium: 3,
    High: 5,
    Critical: 8,
  };

  // ✅ FETCH RESOURCES
  const fetchAvailableResources = async () => {
    try {
      const res = await axios.get(
        `${serverUrl}/api/resource/available-grouped`,
        { withCredentials: true }
      );

      const allResources = [];
      if (res.data.groupedResources) {
        res.data.groupedResources.forEach((group) => {
          allResources.push(...group.resources);
        });
      }
      setAvailableResources(allResources);
    } catch (err) {
      console.warn("Fetch resources error:", err.message);
      try {
        const fallbackRes = await axios.get(
          `${serverUrl}/api/resource/my-list`,
          { withCredentials: true }
        );
        setAvailableResources(fallbackRes.data.resources || []);
      } catch (fallbackErr) {
        console.error("Fallback fetch error:", fallbackErr);
        setAvailableResources([]);
      }
    }
  };

  // ✅ FETCH COORDINATORS
  const fetchCoordinators = async () => {
    if (!selectedIncident) return;
    try {
      const res = await axios.post(
        `${serverUrl}/api/request/nearby`,
        {
          latitude: selectedIncident.location.coordinates[1],
          longitude: selectedIncident.location.coordinates[0],
          maxDistance: 50000,
        },
        { withCredentials: true }
      );
      setCoordinators(res.data.coordinators || []);
      setStep(2);
    } catch (err) {
      console.error("Fetch coordinators error:", err);
      alert("❌ Failed to find coordinators");
    }
  };

  // ✅ FETCH INCIDENTS
  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${serverUrl}/api/incident/list`, {
        withCredentials: true,
      });

      const all = res.data.incidents || [];

      const visibleIncidents = all
        .filter((i) => i.status === "Pending" || i.status === "Active")
        .sort((a, b) => {
          if (a.status === "Pending" && b.status !== "Pending") return -1;
          if (a.status !== "Pending" && b.status === "Pending") return 1;

          const scoreA =
            typeof a.trustScore === "object"
              ? a.trustScore.totalScore || 0
              : a.trustScore || 0;
          const scoreB =
            typeof b.trustScore === "object"
              ? b.trustScore.totalScore || 0
              : b.trustScore || 0;
          return scoreB - scoreA;
        });

      setAllIncidents(all);
      setPendingIncidents(visibleIncidents);

      if (visibleIncidents.length > 0 && !selectedIncident) {
        setSelectedIncident(visibleIncidents[0]);
      }
    } catch (err) {
      console.error("Fetch incidents error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FETCH REQUESTS
  const fetchSentRequests = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/request/agency/list`, {
        withCredentials: true,
      });
      setSentRequests(res.data.requests || []);
    } catch (err) {
      console.error("Fetch requests error:", err);
    }
  };

  // ✅ INITIAL LOAD & AUTO-REFRESH
  useEffect(() => {
    fetchIncidents();
    fetchAvailableResources();
    fetchSentRequests();

    const interval = setInterval(() => {
      fetchSentRequests();
      fetchAvailableResources();
    }, 5000);

    return () => clearInterval(interval);
  }, [serverUrl]);

  // ✅ ACCEPT INCIDENT
  const acceptIncident = async (id) => {
    try {
      await axios.patch(
        `${serverUrl}/api/incident/${id}/status`,
        { status: "Active" },
        { withCredentials: true }
      );
      fetchIncidents();
    } catch (err) {
      console.error("Accept error:", err);
    }
  };

  // ✅ REJECT INCIDENT
  const rejectIncident = async (id) => {
    try {
      await axios.patch(
        `${serverUrl}/api/incident/${id}/mark-spam`,
        {},
        { withCredentials: true }
      );
      fetchIncidents();
    } catch (err) {
      console.error("Reject error:", err);
    }
  };

  // ✅ DISPATCH
  const handleDispatch = async () => {
    if (!selectedCoordinator) return alert("Please select a coordinator");

    try {
      await axios.post(
        `${serverUrl}/api/request/create`,
        {
          coordinatorId: selectedCoordinator._id,
          incidentId: selectedIncident._id,
          resourcesRequested: dispatchResources,
        },
        { withCredentials: true }
      );

      await axios.patch(
        `${serverUrl}/api/incident/${selectedIncident._id}/status`,
        { status: "Active" },
        { withCredentials: true }
      );

      alert(
        `✅ Deployed to ${selectedCoordinator.name}!\n📱 SMS notification sent.`
      );
      setShowDispatchModal(false);
      setStep(1);
      setSelectedCoordinator(null);
      fetchIncidents();
      fetchSentRequests();
    } catch (err) {
      console.error(err);
      alert("❌ Deployment failed");
    }
  };

  // ✅ HELPER FUNCTIONS
  const getSeverityColor = (severity) => {
    const map = {
      critical: "bg-red-100 text-red-800 border-red-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-green-100 text-green-800 border-green-200",
    };
    return map[severity?.toLowerCase()] || "bg-blue-100 text-blue-800 border-blue-200";
  };

  const getTypeIcon = (type) => {
    const map = {
      fire: "🔥",
      medical: "🚑",
      police: "🚨",
      accident: "🚧",
      "natural disaster": "🌪️",
      flood: "🌊",
      earthquake: "📍",
    };
    return map[type?.toLowerCase()] || "⚠️";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Spam":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-white pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* HEADER */}
        <div className="mb-8 border-b border-gray-200 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                <span className="text-4xl">🚨</span>
                Agency Command Center
              </h1>
              <p className="text-gray-600 text-lg">
                Monitor incidents • Dispatch resources • Track deployments
              </p>
            </div>
            <button
              onClick={() => {
                fetchIncidents();
                fetchAvailableResources();
                fetchSentRequests();
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 shadow-md"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* STATS BAR */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-600 text-sm font-semibold uppercase">Pending</div>
            <div className="text-4xl font-bold text-red-700 mt-2">
              {pendingIncidents.filter((i) => i.status === "Pending").length}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-blue-600 text-sm font-semibold uppercase">Active</div>
            <div className="text-4xl font-bold text-blue-700 mt-2">
              {pendingIncidents.filter((i) => i.status === "Active").length}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-600 text-sm font-semibold uppercase">Deployed</div>
            <div className="text-4xl font-bold text-green-700 mt-2">
              {sentRequests.filter((r) => r.status === "Accepted").length}
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-purple-600 text-sm font-semibold uppercase">Resources</div>
            <div className="text-4xl font-bold text-purple-700 mt-2">
              {availableResources.length}
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-3 gap-6">
          {/* LEFT: INCIDENTS QUEUE */}
          <div className="col-span-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[700px]">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Incident Queue</h2>
              <p className="text-gray-600 text-sm">Review and prioritize incidents</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
                </div>
              ) : pendingIncidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <span className="text-5xl mb-3">✅</span>
                  <p className="text-gray-600 font-semibold">All Clear!</p>
                  <p className="text-gray-500 text-sm">No pending incidents</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {pendingIncidents.map((incident) => (
                    <div
                      key={incident._id}
                      onClick={() => setSelectedIncident(incident)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedIncident?._id === incident._id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <span className="text-2xl">
                          {getTypeIcon(incident.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm truncate">
                            {incident.type}
                          </h4>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${getSeverityColor(
                                incident.severity
                              )}`}
                            >
                              {incident.severity}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(
                                incident.status
                              )}`}
                            >
                              {incident.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          {new Date(incident.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="font-bold text-blue-600">
                          {typeof incident.trustScore === "object"
                            ? incident.trustScore.totalScore || "N/A"
                            : incident.trustScore || "N/A"}
                          %
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* MIDDLE & RIGHT: MAP & DETAILS */}
          <div className="col-span-2 space-y-6">
            {/* MAP */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-[340px]">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">🗺️</span>
                  Live Operations Map
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="text-lg">🚨</span> Incidents
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="flex items-center gap-1">
                    <span className="text-lg">📦</span> Resources
                  </span>
                </div>
              </div>
              <div className="h-[calc(100%-60px)]">
                <TacticalMap incidents={allIncidents} resources={availableResources} />
              </div>
            </div>

            {/* INCIDENT DETAILS */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-[340px] flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h3 className="text-lg font-bold text-gray-900">Incident Details</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {selectedIncident ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">
                        Incident Type
                      </label>
                      <p className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-2">
                        <span className="text-2xl">
                          {getTypeIcon(selectedIncident.type)}
                        </span>
                        {selectedIncident.type}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">
                          Severity
                        </label>
                        <span
                          className={`inline-block px-3 py-1.5 rounded-lg font-bold text-sm mt-1 ${getSeverityColor(
                            selectedIncident.severity
                          )}`}
                        >
                          {selectedIncident.severity}
                        </span>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">
                          Trust Score
                        </label>
                        <p className="text-lg font-bold text-blue-600 mt-1">
                          {typeof selectedIncident.trustScore === "object"
                            ? selectedIncident.trustScore.totalScore || "N/A"
                            : selectedIncident.trustScore || "N/A"}
                          %
                        </p>
                      </div>
                    </div>

                    {selectedIncident.description && (
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">
                          Description
                        </label>
                        <p className="text-gray-700 mt-1 line-clamp-2 text-sm">
                          {selectedIncident.description}
                        </p>
                      </div>
                    )}

                    {selectedIncident.transcript && (
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">
                          🎤 Transcript
                        </label>
                        <p className="text-gray-700 mt-1 line-clamp-2 text-sm">
                          {selectedIncident.transcript}
                        </p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200 flex gap-3">
                      {selectedIncident.status === "Pending" && (
                        <>
                          <button
                            onClick={() => rejectIncident(selectedIncident._id)}
                            className="flex-1 px-3 py-2 text-sm font-bold rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-all"
                          >
                            ❌ Reject
                          </button>
                          <button
                            onClick={() => acceptIncident(selectedIncident._id)}
                            className="flex-1 px-3 py-2 text-sm font-bold rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-all"
                          >
                            ✅ Accept
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          const qty =
                            severityPreset[selectedIncident.severity] || 2;
                          setDispatchResources([
                            {
                              item_name: "Medical Kit",
                              category: "Medical",
                              quantity: qty,
                            },
                            {
                              item_name: "Rescue Team",
                              category: "Rescue",
                              quantity: qty,
                            },
                          ]);
                          setShowDispatchModal(true);
                        }}
                        className="flex-1 px-3 py-2 text-sm font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all"
                      >
                        🚀 Deploy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <p className="text-gray-500 font-semibold">
                        Select an incident to view details
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* LIVE DISPATCH REQUESTS */}
        {sentRequests.length > 0 && (
          <div className="mt-8 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              📡 Live Dispatch Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sentRequests.map((req) => (
                <div
                  key={req._id}
                  className="border border-gray-200 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-white"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        req.status === "Accepted"
                          ? "bg-green-100 text-green-700"
                          : req.status === "Rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {req.status === "Accepted" ? "✅ Deployed" : req.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(req.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm mb-1">
                    {req.resourcesRequested
                      ?.map((r) => `${r.quantity} ${r.item_name}`)
                      .join(", ") || "Resources"}
                  </p>
                  <p className="text-xs text-gray-600">
                    📍 {req.coordinatorId?.name || "Unknown Coordinator"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DISPATCH MODAL */}
      {showDispatchModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              {step === 1 ? "🚑 Step 1: Select Resources" : "📡 Step 2: Choose Coordinator"}
            </h2>

            {step === 1 && (
              <>
                <div className="space-y-3 mb-6">
                  {dispatchResources.map((res, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-3 gap-3 items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="text-sm font-bold text-gray-900">
                        {res.item_name}
                      </div>
                      <div className="text-xs text-gray-600">{res.category}</div>
                      <input
                        type="number"
                        min="1"
                        value={res.quantity}
                        onChange={(e) => {
                          const updated = [...dispatchResources];
                          updated[idx].quantity = Number(e.target.value);
                          setDispatchResources(updated);
                        }}
                        className="px-2 py-2 bg-white border border-gray-300 rounded text-gray-900 font-bold text-center text-sm"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDispatchModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-all text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={fetchCoordinators}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-sm font-semibold"
                  >
                    Next →
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Found {coordinators.length} coordinators
                </p>

                <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
                  {coordinators.map((coord) => (
                    <div
                      key={coord._id}
                      onClick={() => setSelectedCoordinator(coord)}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedCoordinator?._id === coord._id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            {coord.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {coord.organization || "N/A"}
                          </p>
                        </div>
                        {selectedCoordinator?._id === coord._id && (
                          <span className="text-blue-600 font-bold">✓</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-all text-sm font-semibold"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleDispatch}
                    disabled={!selectedCoordinator}
                    className={`flex-1 px-4 py-3 rounded-lg transition-all text-sm font-semibold ${
                      selectedCoordinator
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-gray-300 text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    🚀 Deploy
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Agency;