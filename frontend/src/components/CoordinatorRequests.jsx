import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthDataContext } from "../context/AuthDataContext";
import {
    MapPin, AlertCircle, CheckCircle2, XCircle,
    ShieldAlert, Clock, User
} from "lucide-react";
import { toast } from "react-toastify";

const CoordinatorRequests = () => {
    const { serverUrl } = useContext(AuthDataContext);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            // New Endpoint
            const res = await axios.get(`${serverUrl}/api/request/coordinator/list`, { withCredentials: true });
            setRequests(res.data.requests);
        } catch (err) {
            console.error("Error fetching requests:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
        const interval = setInterval(fetchRequests, 5000);
        return () => clearInterval(interval);
    }, [serverUrl]);

    const handleAction = async (requestId, status) => {
        try {
            await axios.patch(`${serverUrl}/api/request/${requestId}/status`,
                { status },
                { withCredentials: true }
            );
            toast.success(`Request ${status}!`);
            fetchRequests(); // Refresh list
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Action failed");
        }
    };

    if (loading) return <div className="animate-pulse h-32 bg-zinc-100 rounded-xl"></div>;

    if (requests.length === 0) {
        return (
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center shadow-sm">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">All Clear</h3>
                <p className="text-zinc-500 mt-2">No pending dispatch requests.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Incoming Dispatch Requests
            </h2>

            {requests.map((req) => (
                <div key={req._id} className="bg-white border-l-4 border-blue-500 rounded-r-xl shadow-md p-5 flex flex-col md:flex-row justify-between gap-6">

                    {/* Left: Info */}
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
                            <ShieldAlert size={14} />
                            Request from {req.agencyId?.name || "Agency"}
                        </div>

                        <div className="space-y-1">
                            <h3 className="font-bold text-lg text-zinc-900">
                                Needed: {req.resourcesRequested.map(r => `${r.quantity}x ${r.item_name}`).join(", ")}
                            </h3>
                            <p className="text-sm text-zinc-500 flex items-center gap-1">
                                <Clock size={14} /> {new Date(req.createdAt).toLocaleTimeString()}
                                <span className="mx-1">•</span>
                                Incident Severity: High
                            </p>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleAction(req._id, "Rejected")}
                            className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                        >
                            <XCircle size={18} /> Decline
                        </button>
                        <button
                            onClick={() => handleAction(req._id, "Accepted")}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <CheckCircle2 size={18} /> Accept & Deploy
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CoordinatorRequests;