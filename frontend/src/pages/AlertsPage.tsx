import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import { ApiService } from "../services/api";
import { Alert } from "../types";
import { SeverityBadge } from "../components/common/SeverityBadge";
import { MitreTag } from "../components/common/MitreTag";

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getAlerts({
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
        rule_id: searchParams.get("rule_id") || undefined,
        limit: 50,
      });
      setAlerts(res.data.alerts);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Failed to load alerts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter, searchParams]);

  const handleAcknowledge = async (e: React.MouseEvent, alertId: string) => {
    e.stopPropagation();
    try {
      await ApiService.acknowledgeAlert(alertId);
      fetchAlerts();
    } catch (err) {
      console.error("Failed to acknowledge alert", err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black font-mono tracking-tight text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
            Alert Management & Triage Queue
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time security detections triggered by Sigma detection rules ({total} active alerts).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAlerts()}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="p-4 rounded-xl bg-[#141b2a] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {["", "NEW", "ACKNOWLEDGED", "INVESTIGATING", "RESOLVED", "FALSE_POSITIVE"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {st || "ALL STATUSES"}
            </button>
          ))}
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Alerts Grid / List */}
      <div className="space-y-3">
        {loading && alerts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-[#141b2a] rounded-2xl border border-slate-800 font-mono text-xs">
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-[#141b2a] rounded-2xl border border-slate-800 font-mono text-xs">
            No alerts matching current triage filters.
          </div>
        ) : (
          alerts.map((al) => (
            <div
              key={al.id}
              onClick={() => navigate(`/alerts/${al.id}`)}
              className="p-5 rounded-2xl bg-[#141b2a] hover:bg-[#182135] border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={al.severity} size="sm" />
                  <MitreTag
                    techniqueId={al.mitre_technique_id}
                    techniqueName={al.mitre_technique_name}
                    tactic={al.mitre_tactic}
                  />
                  <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {al.rule_id}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      al.status === "NEW"
                        ? "bg-red-950 text-red-400 border border-red-500/30"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {al.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                  {al.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-1">{al.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                  <span>Host: <strong className="text-slate-300">{al.affected_hosts[0] || "lab-linux-01"}</strong></span>
                  {al.source_ips.length > 0 && (
                    <span>Source IP: <strong className="text-red-400">{al.source_ips[0]}</strong></span>
                  )}
                  {al.target_users.length > 0 && (
                    <span>User: <strong className="text-purple-400">{al.target_users[0]}</strong></span>
                  )}
                  <span>Count: <strong className="text-cyan-400">{al.event_count}</strong></span>
                  <span>First Seen: {new Date(al.first_seen).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0">
                {al.status === "NEW" && (
                  <button
                    onClick={(e) => handleAcknowledge(e, al.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-950 hover:text-emerald-400 hover:border-emerald-500/40 border border-slate-700 text-xs font-bold text-slate-300 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ack
                  </button>
                )}
                {al.incident_id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/incidents/${al.incident_id}`); }}
                    className="px-3 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Incident
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
