import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  FolderGit2,
  Flame,
  ShieldCheck,
  Clock,
  Crosshair,
  TrendingUp,
  Server,
  Terminal,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { ApiService } from "../services/api";
import { DashboardSummary } from "../types";
import { SeverityBadge } from "../components/common/SeverityBadge";

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [severityData, setSeverityData] = useState<{ alerts: any[]; incidents: any[] }>({ alerts: [], incidents: [] });
  const [mitreData, setMitreData] = useState<any[]>([]);
  const [topAssets, setTopAssets] = useState<{ top_hosts: any[]; top_source_ips: any[] }>({ top_hosts: [], top_source_ips: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const [sumRes, timeRes, sevRes, mitreRes, assetsRes] = await Promise.all([
        ApiService.getDashboardSummary(),
        ApiService.getDashboardTimeline(),
        ApiService.getSeverityBreakdown(),
        ApiService.getMitreDistribution(),
        ApiService.getTopAssets(),
      ]);

      setSummary(sumRes.data);
      setTimeline(timeRes.data);
      setSeverityData(sevRes.data);
      setMitreData(mitreRes.data);
      setTopAssets(assetsRes.data);
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // 10s live polling
    return () => clearInterval(interval);
  }, []);

  const SEV_COLORS: Record<string, string> = {
    Critical: "#ef4444",
    High: "#f97316",
    Medium: "#eab308",
    Low: "#3b82f6",
    Info: "#64748b",
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#141b2a] via-[#162035] to-[#141b2a] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
              SOC Command Center • Realtime Telemetry
            </span>
          </div>
          <h2 className="text-2xl font-black font-mono tracking-tight text-slate-100">
            CyberRange Attack Detection Lab
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous threat monitoring, automated Sigma detection evaluation, and incident response workbench.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/simulations")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-xs font-bold shadow-lg shadow-red-900/40 transition-all cursor-pointer"
          >
            <Flame className="w-4 h-4" />
            <span>Launch Attack Simulation</span>
          </button>
          <button
            onClick={() => navigate("/training")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-bold transition-all cursor-pointer"
          >
            <Crosshair className="w-4 h-4" />
            <span>Blue Team Mode</span>
          </button>
        </div>
      </div>

      {/* Top 8 KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#141b2a] border border-slate-800 flex items-center justify-between hover:border-cyan-500/40 transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase font-mono">Total Events</p>
            <h3 className="text-2xl font-black font-mono text-slate-100 mt-1">
              {summary?.total_events.toLocaleString() || "..."}
            </h3>
            <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" /> Live Ingest Feed
            </span>
          </div>
          <div className="p-3 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#141b2a] border border-slate-800 flex items-center justify-between hover:border-orange-500/40 transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase font-mono">Triggered Alerts</p>
            <h3 className="text-2xl font-black font-mono text-slate-100 mt-1">
              {summary?.total_alerts.toLocaleString() || "..."}
            </h3>
            <span className="text-[10px] text-orange-400 font-mono">
              {summary?.high_alerts || 0} High • {summary?.critical_alerts || 0} Critical
            </span>
          </div>
          <div className="p-3 rounded-lg bg-orange-950/60 border border-orange-500/30 text-orange-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#141b2a] border border-slate-800 flex items-center justify-between hover:border-purple-500/40 transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase font-mono">Active Incidents</p>
            <h3 className="text-2xl font-black font-mono text-slate-100 mt-1">
              {summary?.open_incidents || "..."}
            </h3>
            <span className="text-[10px] text-purple-400 font-mono">
              Avg Risk Score: {summary?.average_risk_score || 0}/100
            </span>
          </div>
          <div className="p-3 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-400">
            <FolderGit2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#141b2a] border border-slate-800 flex items-center justify-between hover:border-emerald-500/40 transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase font-mono">Detection Rate</p>
            <h3 className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {summary?.detection_rate || 0}%
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              FP Rate: {summary?.false_positive_rate || 0}%
            </span>
          </div>
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
          <Clock className="w-4 h-4 text-cyan-400" />
          <div>
            <span className="text-[11px] text-slate-400">MTTA (Mean Time to Ack)</span>
            <p className="text-sm font-bold font-mono text-slate-200">{summary?.mtta_minutes || 4.2} mins</p>
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
          <Clock className="w-4 h-4 text-purple-400" />
          <div>
            <span className="text-[11px] text-slate-400">MTTR (Mean Time to Resolve)</span>
            <p className="text-sm font-bold font-mono text-slate-200">{summary?.mttr_minutes || 28.5} mins</p>
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
          <Server className="w-4 h-4 text-emerald-400" />
          <div>
            <span className="text-[11px] text-slate-400">Monitored Lab Hosts</span>
            <p className="text-sm font-bold font-mono text-slate-200">5 Lab Systems</p>
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
          <Flame className="w-4 h-4 text-orange-400" />
          <div>
            <span className="text-[11px] text-slate-400">Simulations Executed</span>
            <p className="text-sm font-bold font-mono text-slate-200">{summary?.active_scenarios || 0} Runs</p>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time-Series Telemetry (Events & Alerts over time) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#141b2a] border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-200">
                Security Telemetry & Alert Stream (12h)
              </h3>
              <p className="text-xs text-slate-400">Raw ingested events vs correlated alert spikes</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Events
              </span>
              <span className="flex items-center gap-1.5 text-orange-400">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400" /> Alerts
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="eventGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f141f", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="events" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#eventGradient)" />
                <Area type="monotone" dataKey="alerts" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#alertGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution Donut */}
        <div className="p-5 rounded-2xl bg-[#141b2a] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-200">
              Alert Severity Breakdown
            </h3>
            <p className="text-xs text-slate-400">Distribution by impact level</p>
          </div>

          <div className="h-48 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData.alerts}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {severityData.alerts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SEV_COLORS[entry.name] || "#3b82f6"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f141f", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
            {severityData.alerts.slice(0, 3).map((item) => (
              <div key={item.name} className="flex flex-col">
                <span className="text-slate-400 text-[10px] uppercase">{item.name}</span>
                <span className="font-mono font-bold text-slate-100">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MITRE & Top Attacked Assets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MITRE ATT&CK Tactic Distribution */}
        <div className="p-5 rounded-2xl bg-[#141b2a] border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-200">
                MITRE ATT&CK Tactics Observed
              </h3>
              <p className="text-xs text-slate-400">Distribution of adversary techniques mapped to kill-chain</p>
            </div>
            <button
              onClick={() => navigate("/coverage")}
              className="text-xs text-cyan-400 hover:underline font-mono"
            >
              View Matrix &rarr;
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mitreData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="tactic" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-25} textAnchor="end" />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f141f", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Attacked Hosts & Top Source IPs */}
        <div className="p-5 rounded-2xl bg-[#141b2a] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-200">
              Top Targeted Hosts & Adversary IPs
            </h3>
            <p className="text-xs text-slate-400">High-volume threat vectors and lab destinations</p>
          </div>

          <div className="grid grid-cols-2 gap-4 my-3">
            {/* Top Hosts */}
            <div>
              <p className="text-xs font-mono uppercase text-slate-400 mb-2 font-semibold">Top Targeted Hosts</p>
              <div className="space-y-2">
                {topAssets.top_hosts.map((h, i) => (
                  <div
                    key={h.host}
                    onClick={() => navigate(`/events?host=${encodeURIComponent(h.host)}`)}
                    className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs cursor-pointer transition-colors"
                  >
                    <span className="font-mono text-slate-200">{h.host}</span>
                    <span className="font-mono font-bold text-cyan-400">{h.count} ev</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Source IPs */}
            <div>
              <p className="text-xs font-mono uppercase text-slate-400 mb-2 font-semibold">Top Source IPs</p>
              <div className="space-y-2">
                {topAssets.top_source_ips.map((ip, i) => (
                  <div
                    key={ip.ip}
                    onClick={() => navigate(`/events?source_ip=${encodeURIComponent(ip.ip)}`)}
                    className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs cursor-pointer transition-colors"
                  >
                    <span className="font-mono text-red-400">{ip.ip}</span>
                    <span className="font-mono font-bold text-orange-400">{ip.count} ev</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">All data refreshed live from DB</span>
            <button
              onClick={() => navigate("/hunting")}
              className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
            >
              <Crosshair className="w-3.5 h-3.5" /> Pivot to Threat Hunt &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
