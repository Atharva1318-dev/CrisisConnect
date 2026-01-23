import React from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Users, 
  MapPin,
  Shield,
  CheckCircle,
  Activity,
  Zap
} from "lucide-react";

const AnalyticsPage = () => {
  // Static data for the analytics page
  const analyticsData = {
    overview: {
      totalIncidents: 128,
      resolvedIncidents: 89,
      avgResponseTime: "4.2 min",
      activeTeams: 12,
      coverageArea: "85%",
      satisfactionRate: "92%"
    },
    incidentTrends: [
      { month: "Jan", count: 42 },
      { month: "Feb", count: 38 },
      { month: "Mar", count: 56 },
      { month: "Apr", count: 48 },
      { month: "May", count: 65 },
      { month: "Jun", count: 72 },
      { month: "Jul", count: 59 },
      { month: "Aug", count: 84 },
    ],
    incidentTypes: [
      { type: "Medical", count: 38, color: "bg-red-500" },
      { type: "Fire", count: 24, color: "bg-orange-500" },
      { type: "Police", count: 32, color: "bg-blue-500" },
      { type: "Accident", count: 19, color: "bg-yellow-500" },
      { type: "Natural Disaster", count: 8, color: "bg-purple-500" },
      { type: "Other", count: 7, color: "bg-gray-500" },
    ],
    severityDistribution: [
      { severity: "Critical", count: 15, percentage: 12 },
      { severity: "High", count: 28, percentage: 22 },
      { severity: "Medium", count: 52, percentage: 41 },
      { severity: "Low", count: 33, percentage: 25 },
    ],
    responseTimes: [
      { region: "Downtown", time: "3.1 min", trend: "down" },
      { region: "North District", time: "4.8 min", trend: "up" },
      { region: "South District", time: "3.9 min", trend: "down" },
      { region: "East District", time: "5.2 min", trend: "stable" },
      { region: "West District", time: "4.1 min", trend: "down" },
    ],
    topTeams: [
      { team: "Alpha Team", incidents: 42, success: "98%" },
      { team: "Bravo Team", incidents: 38, success: "96%" },
      { team: "Charlie Team", incidents: 35, success: "94%" },
      { team: "Delta Team", incidents: 31, success: "97%" },
      { team: "Echo Team", incidents: 28, success: "95%" },
    ],
    recentActivity: [
      { time: "10:30 AM", action: "Medical incident resolved", location: "Downtown", status: "success" },
      { time: "09:45 AM", action: "Fire incident dispatched", location: "North District", status: "active" },
      { time: "08:20 AM", action: "Accident response completed", location: "Highway 101", status: "success" },
      { time: "07:15 AM", action: "Police backup requested", location: "East District", status: "pending" },
      { time: "06:30 AM", action: "Natural disaster alert", location: "Coastal Area", status: "monitoring" },
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                Agency Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Comprehensive insights and performance metrics</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="text-xs text-gray-500">Last Updated</div>
                <div className="text-sm font-semibold text-gray-900">Today, 10:45 AM</div>
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </header>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{analyticsData.overview.totalIncidents}</div>
            <p className="text-gray-600 text-sm mt-1">Incidents Handled</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Resolved</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{analyticsData.overview.resolvedIncidents}</div>
            <p className="text-gray-600 text-sm mt-1">Successful Responses</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Average</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{analyticsData.overview.avgResponseTime}</div>
            <p className="text-gray-600 text-sm mt-1">Response Time</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Active</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{analyticsData.overview.activeTeams}</div>
            <p className="text-gray-600 text-sm mt-1">Response Teams</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-50 rounded-lg">
                <MapPin className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-sm text-gray-500">Coverage</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{analyticsData.overview.coverageArea}</div>
            <p className="text-gray-600 text-sm mt-1">Area Coverage</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-50 rounded-lg">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-sm text-gray-500">Satisfaction</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{analyticsData.overview.satisfactionRate}</div>
            <p className="text-gray-600 text-sm mt-1">Success Rate</p>
          </div>
        </div>

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Incident Trends Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Incident Trends (Last 8 Months)
                </h2>
                <p className="text-gray-600 text-sm mt-1">Monthly incident volume analysis</p>
              </div>
              <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                15% Increase
              </div>
            </div>
            <div className="h-64">
              <div className="flex items-end justify-between h-full space-x-2">
                {analyticsData.incidentTrends.map((item, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-600 rounded-t-lg transition-all hover:opacity-90"
                      style={{ height: `${(item.count / 100) * 200}px` }}
                    ></div>
                    <div className="mt-2 text-sm text-gray-600">{item.month}</div>
                    <div className="text-sm font-semibold text-gray-900">{item.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Incident Type Distribution */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Incident Type Distribution
                </h2>
                <p className="text-gray-600 text-sm mt-1">Breakdown by incident category</p>
              </div>
              <div className="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-sm font-medium">
                Total: 128
              </div>
            </div>
            <div className="space-y-4">
              {analyticsData.incidentTypes.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 ${item.color} rounded-full`}></div>
                    <span className="text-gray-700">{item.type}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: `${(item.count / analyticsData.overview.totalIncidents) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold text-gray-900 w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Second Row - 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Severity Distribution */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                Severity Distribution
              </h2>
              <p className="text-gray-600 text-sm mt-1">Incident severity levels</p>
            </div>
            <div className="space-y-4">
              {analyticsData.severityDistribution.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">{item.severity}</span>
                    <span className="font-semibold text-gray-900">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-full ${
                        item.severity === 'Critical' ? 'bg-red-500' :
                        item.severity === 'High' ? 'bg-orange-500' :
                        item.severity === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                      } rounded-full`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Response Times by Region */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Response Times by Region
              </h2>
              <p className="text-gray-600 text-sm mt-1">Average response time analysis</p>
            </div>
            <div className="space-y-4">
              {analyticsData.responseTimes.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{item.region}</div>
                    <div className="text-sm text-gray-600">{item.time} average</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.trend === 'down' ? 'bg-green-100 text-green-800' :
                    item.trend === 'up' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.trend === 'down' ? '↓ Improving' : item.trend === 'up' ? '↑ Slower' : '→ Stable'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Teams */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Top Performing Teams
              </h2>
              <p className="text-gray-600 text-sm mt-1">Based on incident resolution</p>
            </div>
            <div className="space-y-4">
              {analyticsData.topTeams.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {item.team.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{item.team}</div>
                      <div className="text-sm text-gray-600">{item.incidents} incidents</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {item.success} success
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-600" />
                Recent Activity
              </h2>
              <p className="text-gray-600 text-sm mt-1">Latest incident and response updates</p>
            </div>
            <div className="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-sm font-medium">
              Live Updates
            </div>
          </div>
          <div className="space-y-3">
            {analyticsData.recentActivity.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    item.status === 'success' ? 'bg-green-500' :
                    item.status === 'active' ? 'bg-blue-500' :
                    item.status === 'pending' ? 'bg-yellow-500' : 'bg-purple-500'
                  }`}></div>
                  <div>
                    <div className="font-medium text-gray-900">{item.action}</div>
                    <div className="text-sm text-gray-600">{item.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.status === 'success' ? 'bg-green-100 text-green-800' :
                    item.status === 'active' ? 'bg-blue-100 text-blue-800' :
                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </div>
                  <div className="text-sm text-gray-500">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              Analytics Dashboard • Data updated in real-time • v2.1
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>All systems operational</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AnalyticsPage;