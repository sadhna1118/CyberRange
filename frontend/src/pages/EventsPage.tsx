import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ScrollText,
  Search,
  Filter,
  Download,
  Plus,
  RefreshCw,
  Code,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ApiService } from "../services/api";
import { SecurityEvent } from "../types";
import { SeverityBadge } from "../components/common/SeverityBadge";

export const EventsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [rawPayload, setRawPayload] = useState(
    '{\n  "source": "linux-auth",\n  "host": "lab-linux-01",\n  "event_type": "authentication",\n  "action": "login_failed",\n  "user": "root",\n  "source_ip": "10.10.10.50",\n  "raw_message": "Failed password for root from 10.10.10.50 port 49120 ssh2"\n}'
  );

  const [filterType, setFilterType] = useState(searchParams.get("event_type") || "");
  const [filterSeverity, setFilterSeverity] = useState(searchParams.get("severity") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(0);
  const limit = 25;

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getEvents({
        event_type: filterType || undefined,
        severity: filterSeverity || undefined,
        search: searchQuery || undefined,
        host: searchParams.get("host") || undefined,
        source_ip: searchParams.get("source_ip") || undefined,
        limit,
        offset: page * limit,
      });
      setEvents(res.data.events);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, filterType, filterSeverity, searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchEvents();
  };

  const handleIngestSubmit = async () => {
    try {
      const parsed = JSON.parse(rawPayload);
      await ApiService.ingestEvent(parsed);
      setShowIngestModal(false);
      fetchEvents();
    } catch (err: any) {
      alert("Invalid JSON payload: " + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black font-mono tracking-tight text-slate-100 flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-cyan-400" />
            Security Event Ingestion & Log Stream
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Normalized SIEM telemetry across authentication, web, endpoint, and network categories ({total.toLocaleString()} records).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowIngestModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Ingest Synthetic Event
          </button>
          <button
            onClick={() => fetchEvents()}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-[#141b2a] border border-slate-800 flex flex-col md:flex-row items-center gap-4 justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search raw messages, processes, IPs, users..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="">All Event Types</option>
            <option value="authentication">Authentication</option>
            <option value="web">Web Access</option>
            <option value="endpoint">Endpoint / Process</option>
            <option value="network">Network Flow</option>
            <option value="privilege">Privilege Escalation</option>
            <option value="file">File Access</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => { setFilterSeverity(e.target.value); setPage(0); }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-2xl bg-[#141b2a] border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Type / Action</th>
                <th className="py-3 px-4">Host</th>
                <th className="py-3 px-4">Source IP</th>
                <th className="py-3 px-4">Target User</th>
                <th className="py-3 px-4">Raw Log Message</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading && events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading security events telemetry...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching events found. Try modifying filters or running an attack simulation.
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr
                    key={ev.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedEvent(ev)}
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                      {new Date(ev.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={ev.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-cyan-400 font-semibold">{ev.event_type}</span>
                      <span className="text-slate-400"> / {ev.action}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{ev.host}</td>
                    <td className="py-3 px-4 text-orange-400">{ev.source_ip || "-"}</td>
                    <td className="py-3 px-4 text-purple-400">{ev.user || "-"}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-md truncate">
                      {ev.raw_message}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[10px]"
                      >
                        JSON
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>
            Showing {events.length > 0 ? page * limit + 1 : 0} to{" "}
            {Math.min((page + 1) * limit, total)} of {total.toLocaleString()} events
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-slate-200">Page {page + 1}</span>
            <button
              disabled={(page + 1) * limit >= total}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* JSON Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141b2a] border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-cyan-400" />
                <h3 className="font-mono font-bold text-sm text-slate-200">
                  Normalized Event Payload (`{selectedEvent.id}`)
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto font-mono text-xs text-cyan-300 bg-slate-950/80">
              <pre>{JSON.stringify(selectedEvent, null, 2)}</pre>
            </div>
            <div className="p-3 border-t border-slate-800 flex justify-end bg-slate-900/60">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Synthetic Ingest Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141b2a] border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono font-bold text-base text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" /> Manual Event Ingestion
              </h3>
              <button onClick={() => setShowIngestModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Enter raw or structured JSON event to push into normalizer and detection engine:
            </p>
            <textarea
              rows={8}
              value={rawPayload}
              onChange={(e) => setRawPayload(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-cyan-400 font-mono focus:outline-none focus:border-cyan-500"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowIngestModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleIngestSubmit}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-lg shadow-cyan-600/30"
              >
                Submit & Trigger Detection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
