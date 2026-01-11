import React, { useEffect, useState, useContext } from 'react';
import { useSelector } from 'react-redux';
import { AuthDataContext } from '../context/AuthDataContext';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import axios from 'axios';
import { ShieldAlert, ArrowRight, Activity, Users, Map as MapIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const { userData } = useSelector((state) => state.user);
  const { serverUrl } = useContext(AuthDataContext);

  // State
  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showChatBot, setShowChatBot] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // --- DATA FETCHING (Only if logged in) ---
  useEffect(() => {
    if (!userData) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      });
    }

    const fetchData = async () => {
      try {
        const incidentRes = await axios.get(`${serverUrl}/api/crisis/incidents`);
        const resourceRes = await axios.get(`${serverUrl}/api/crisis/resources`);
        setIncidents(incidentRes.data);
        setResources(resourceRes.data);
      } catch (error) {
        console.error("Error fetching map data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [serverUrl, userData]);


  // --- VIEW 1: LANDING PAGE (Not Logged In) ---
  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <div className="bg-red-100 p-4 rounded-full mb-6 text-red-600 animate-pulse">
          <ShieldAlert size={64} />
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
          Crisis<span className="text-red-600">Connect</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mb-8 leading-relaxed">
          A next-generation real-time crisis response platform.
          Bridging the gap between citizens, agencies, and resources using AI and Live Mapping.
        </p>

        <div className="flex gap-4 mb-16">
          <Link to="/signup" className="px-8 py-3 bg-red-600 text-white rounded-full font-bold text-lg hover:bg-red-700 transition-all shadow-lg flex items-center gap-2">
            Get Started <ArrowRight size={20} />
          </Link>
          <Link to="/login" className="px-8 py-3 bg-white text-gray-800 border border-gray-300 rounded-full font-bold text-lg hover:bg-gray-50 transition-all">
            Live Demo
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl">
          <FeatureCard
            icon={<MapIcon className="text-blue-500" />}
            title="Real-Time Mapping"
            desc="Live visualization of incidents and resources on an interactive map."
          />
          <FeatureCard
            icon={<Activity className="text-red-500" />}
            title="AI Triage"
            desc="Gemini AI analyzes reports instantly to prioritize critical emergencies."
          />
          <FeatureCard
            icon={<Users className="text-green-500" />}
            title="Agency Coordination"
            desc="Dedicated dashboards for police, medics, and NGOs to coordinate response."
          />
        </div>
      </div>
    );
  }

  // --- VIEW 2: DASHBOARD (Logged In) ---
  return (
    // Height Calculation: 100vh - (approx height of Navbar spacer + Footer space)
    // Adjust 'h-[calc(100vh-6rem)]' if needed to fit your exact preference
    <div className="relative w-full flex overflow-hidden border-t border-gray-200 dark:border-gray-800" style={{ height: 'calc(100vh - 6rem)' }}>

      {/* --- SIDEBAR --- */}
      <div className="w-80 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-gray-800 z-10 flex flex-col h-full overflow-y-auto hidden md:flex">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            Role: <span className="font-semibold uppercase text-blue-600">{userData.role}</span>
          </p>
        </div>

        <div className="p-4 space-y-4">
          {/* Contextual Actions based on Role */}
          {userData.role === 'citizen' ? (
            <button
              onClick={() => setShowReportModal(true)}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <ShieldAlert size={18} /> REPORT INCIDENT
            </button>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
              <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">Agency Stats</h3>
              <div className="flex justify-between text-sm">
                <span>Active Cases:</span>
                <span className="font-bold">{incidents.length}</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowChatBot(!showChatBot)}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-colors mt-4"
          >
            Start Commander AI
          </button>
        </div>
      </div>

      {/* --- MAP --- */}
      <div className="flex-1 h-full relative z-0">
        <MapContainer
          center={userLocation || [19.0760, 72.8777]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {incidents.map((incident) => (
            <Marker
              key={incident._id}
              position={[incident.location.coordinates[1], incident.location.coordinates[0]]}
            >
              <Popup>
                <div className="p-1">
                  <h3 className="font-bold text-red-600">{incident.type}</h3>
                  <p className="text-sm">{incident.description}</p>
                </div>
              </Popup>
            </Marker>
          ))}
          {userLocation && (
            <Circle center={userLocation} radius={500} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }} />
          )}
        </MapContainer>

        {/* Mobile Report Button (Floating) */}
        <button
          onClick={() => setShowReportModal(true)}
          className="md:hidden absolute bottom-6 right-6 z-[400] bg-red-600 text-white p-4 rounded-full shadow-xl"
        >
          <ShieldAlert size={24} />
        </button>
      </div>

      {/* --- MODALS (Keep existing IncidentForm & CommanderChat Logic here) --- */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          {/* ... Reuse your existing IncidentForm Component ... */}
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Report Incident</h2>
            {/* Simplified for brevity, reuse your form logic */}
            <button onClick={() => setShowReportModal(false)} className="text-red-500">Close</button>
          </div>
        </div>
      )}

      {showChatBot && (
        <div className="fixed bottom-24 right-6 z-[100] w-80 h-96 bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
          {/* ... Reuse your existing CommanderChat Component ... */}
          <div className="bg-indigo-600 p-3 text-white flex justify-between">
            <span>Commander AI</span>
            <button onClick={() => setShowChatBot(false)}>×</button>
          </div>
          <div className="flex-1 p-4 bg-gray-50 text-center text-gray-500 text-sm">
            AI Chat Interface Loaded
          </div>
        </div>
      )}

    </div>
  );
};

// Helper for Landing Page
const FeatureCard = ({ icon, title, desc }) => (
  <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 text-left hover:shadow-md transition-shadow">
    <div className="mb-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg inline-block">{icon}</div>
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
  </div>
);

export default Home;