import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderGit2,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Flame,
  ArrowRight,
} from "lucide-react";
import { ApiService } from "../services/api";
import { Incident } from "../types";
import { SeverityBadge } from "../components/common/SeverityBadge";
import { RiskGauge } from "../components/common/RiskGauge";

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getIncidents({
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        limit: 50,
      });
      setIncidents(res.data.incidents);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Failed to load incidents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIncidents();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black font-mono tracking-tight text-slate-100 flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-purple-400" />
            Security Incident Response Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Correlated multi-alert security incidents grouped across attack stages ({total} incidents).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/simulations")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 text-white text-xs font-bold shadow-lg shadow-red-900/30 cursor-pointer"
          >
            <Flame className="w-4 h-4" /> Trigger Attack Simulation
          </button>
          <button
            onClick={() => fetchIncidents()}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-4 rounded-xl bg-[#141b2a] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {["", "OPEN", "INVESTIGATING", "CONTAINED", "CLOSED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {st || "ALL INCIDENTS"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search incident title, host, correlation ID..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500 font-mono"
          />
        </form>
      </div>

      {/* Incidents List */}
      <div className="grid grid-cols-1 gap-4">
        {loading && incidents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-[#141b2a] rounded-2xl border border-slate-800 font-mono text-xs">
            Loading incidents...
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-[#141b2a] rounded-2xl border border-slate-800 font-mono text-xs">
            No active incidents matching filters.
          </div>
        ) : (
          incidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => navigate(`/incidents/${inc.id}`)}
              className="p-6 rounded-2xl bg-[#141b2a] hover:bg-[#182135] border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 group"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={inc.severity} size="sm" />
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      inc.status === "OPEN"
                        ? "bg-red-950 text-red-400 border border-red-500/40"
                        : inc.status === "CONTAINED"
                        ? "bg-cyan-950 text-cyan-400 border border-cyan-500/40"
                        : inc.status === "CLOSED"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    STATUS: {inc.status}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {inc.correlation_id || `INC-${inc.id.substring(0, 8)}`}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      inc.containment_status === "CONTAINED"
                        ? "bg-emerald-950/70 text-emerald-400 border border-emerald-500/30"
                        : "bg-orange-950/70 text-orange-400 border border-orange-500/30"
                    }`}
                  >
                    {inc.containment_status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-100 group-hover:text-purple-400 transition-colors">
                  {inc.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">{inc.description}</p>

                {/* MITRE Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {inc.mitre_techniques.slice(0, 4).map((m, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/50 text-purple-300 border border-purple-500/30"
                    >
                      {m.technique_id} ({m.tactic})
                    </span>
                  ))}
                  {inc.mitre_techniques.length > 4 && (
                    <span className="text-[10px] font-mono text-slate-400">
                      +{inc.mitre_techniques.length - 4} more
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono">
                  <span>Assets: <strong className="text-slate-200">{inc.affected_assets.join(", ") || "lab-linux-01"}</strong></span>
                  <span>Indicators: <strong className="text-red-400">{inc.indicators.join(", ") || "N/A"}</strong></span>
                  <span>Created: {new Date(inc.created_at).toLocaleDateString()} {new Date(inc.created_at).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Right Side: Risk Gauge & Action Button */}
              <div className="flex items-center gap-6 border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6 shrink-0 justify-between lg:justify-end">
                <RiskGauge score={inc.risk_score} size="md" />
                <button className="flex items-center gap-1 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-900/30 transition-all">
                  <span>Investigate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
