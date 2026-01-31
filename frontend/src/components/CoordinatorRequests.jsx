import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthDataContext } from "../context/AuthDataContext";
import {
    MapPin, Truck, CheckCircle2,
    ArrowRight, Flame, Droplets, AlertTriangle, ShieldAlert, User
} from "lucide-react";
import { toast } from "react-toastify";

const CoordinatorRequests = () => {
    const { serverUrl } = useContext(AuthDataContext);
    const [groupedRequests, setGroupedRequests] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchActiveMissions = async () => {
        try {
            const res = await axios.get(`${serverUrl}/api/resource/my-list`, { withCredentials: true });

            // 1. Filter only 'Reserved' items
            const reserved = res.data.resources.filter(r => r.status === 'Reserved');

            // 2. GROUPING LOGIC: Group by Incident ID
            const groups = reserved.reduce((acc, resource) => {
                const inc = resource.current_incident || { type: "Direct Request", _id: "unknown" };
                const incId = inc._id;

                if (!acc[incId]) {
                    acc[incId] = {
                        incident: inc,
                        agency: inc.reportedBy, // The Agency who asked
                        owner: resource.owner,  // The Coordinator assigned
                        resources: []
                    };
                }
                acc[incId].resources.push(resource);
                return acc;
            }, {});

            setGroupedRequests(groups);
        } catch (err) {
            console.error("Error fetching missions:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveMissions();
        const interval = setInterval(fetchActiveMissions, 5000);
        return () => clearInterval(interval);
    }, [serverUrl]);

    // Deploy List of Resources (used for "Deploy All" AND "Deploy Single")
    const deployResources = async (resourceIds) => {
        try {
            await Promise.all(resourceIds.map(id =>
                axios.patch(`${serverUrl}/api/resource/update/${id}`,
                    { status: "Deployed" },
                    { withCredentials: true }
                )
            ));
            toast.success(`Deployment confirmed!`);
            fetchActiveMissions();
        } catch (err) {
            console.error(err);
            toast.error("Failed to deploy units");
        }
    };

    // Helper to consolidate duplicate items (e.g., "Medical Kit" x 5)
    const consolidateItems = (resources) => {
        const counts = resources.reduce((acc, curr) => {
            const name = curr.item_name;
            if (!acc[name]) acc[name] = { ...curr, count: 0, ids: [] };
            acc[name].count += (curr.quantity || 1);
            acc[name].ids.push(curr._id);
            return acc;
        }, {});
        return Object.values(counts);
    };

    if (loading) return <div className="animate-pulse h-32 bg-zinc-100 rounded-xl"></div>;

    if (Object.keys(groupedRequests).length === 0) {
        return (
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center shadow-sm">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">All Systems Normal</h3>
                <p className="text-zinc-500 mt-2">No active dispatch requests.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Critical Dispatch Requests
            </h2>

            {Object.values(groupedRequests).map((group, idx) => {
                const inc = group.incident;
                const IncidentIcon = inc.type === 'Fire' ? Flame : inc.type === 'Flood' ? Droplets : AlertTriangle;
                const consolidatedResources = consolidateItems(group.resources);

                // Collect ALL IDs for the "Deploy All" button
                const allIds = group.resources.map(r => r._id);

                return (
                    <div key={idx} className="bg-white border-l-4 border-red-500 rounded-r-xl shadow-md overflow-hidden">

                        {/* HEADER: Incident + Agency Info */}
                        <div className="bg-red-50 p-4 border-b border-red-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex gap-3">
                                <div className="p-2 bg-red-100 text-red-600 rounded-lg h-fit">
                                    <IncidentIcon size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900 text-lg flex items-center gap-2">
                                        {inc.type || "Emergency"} Incident
                                        {group.agency && (
                                            <span className="text-xs font-normal bg-white px-2 py-0.5 rounded border border-red-200 text-red-600 flex items-center gap-1">
                                                <ShieldAlert size={10} /> Req. by {group.agency.name}
                                            </span>
                                        )}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="flex items-center gap-1 text-xs text-zinc-500 font-mono">
                                            <MapPin size={12} />
                                            {inc.location?.coordinates
                                                ? `${inc.location.coordinates[1].toFixed(4)}, ${inc.location.coordinates[0].toFixed(4)}`
                                                : "Locating..."}
                                        </div>
                                        {group.owner && (
                                            <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                                                <User size={12} /> Assigned by: {group.owner.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => deployResources(allIds)}
                                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm shadow-red-200 transition-all active:scale-95"
                            >
                                Deploy All Units <ArrowRight size={16} />
                            </button>
                        </div>

                        {/* LIST: Consolidated Resources */}
                        <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-3">
                            {consolidatedResources.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-xl hover:border-red-200 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-zinc-100 text-zinc-400">
                                            <Truck size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-zinc-900 text-base">
                                                {item.item_name}
                                            </p>
                                            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                                                {item.category}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="bg-zinc-200 text-zinc-700 px-2.5 py-1 rounded-md text-sm font-bold">
                                            x{item.count}
                                        </span>
                                        {/* 👇 RE-ADDED DEPLOY SINGLE BUTTON */}
                                        <button
                                            onClick={() => deployResources(item.ids)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-bold px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                        >
                                            Deploy
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CoordinatorRequests;