import React from "react";
import { NavLink } from "react-router-dom";
import {
  Shield,
  Activity,
  AlertTriangle,
  FolderGit2,
  Crosshair,
  FileCode2,
  Cpu,
  GraduationCap,
  FileSearch,
  Database,
  ScrollText,
  FileText,
  Settings,
  Flame,
} from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";

export const Sidebar: React.FC = () => {
  const { wsConnected } = useNotifications();

  const navItems = [
    { to: "/dashboard", icon: Activity, label: "SOC Dashboard" },
    { to: "/events", icon: ScrollText, label: "Event Ingestion" },
    { to: "/alerts", icon: AlertTriangle, label: "Alert Management" },
    { to: "/incidents", icon: FolderGit2, label: "Incidents & IR" },
    { to: "/simulations", icon: Flame, label: "Attack Simulator", badge: "Live Lab" },
    { to: "/hunting", icon: Crosshair, label: "Threat Hunting" },
    { to: "/detections", icon: FileCode2, label: "Detection Rules" },
    { to: "/coverage", icon: Cpu, label: "MITRE ATT&CK" },
    { to: "/training", icon: GraduationCap, label: "Blue Team Mode", badge: "Score" },
    { to: "/iocs", icon: Database, label: "IOC Vault" },
    { to: "/reports", icon: FileText, label: "Incident Reports" },
    { to: "/audit", icon: FileSearch, label: "Audit & Compliance" },
    { to: "/settings", icon: Settings, label: "Lab Config" },
  ];

  return (
    <aside className="w-64 bg-[#0f141f] border-r border-slate-800 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800/80 gap-3 bg-slate-900/40">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-mono font-black text-sm tracking-wider text-slate-100 flex items-center gap-1.5">
            CYBERRANGE <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40">LAB</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Detection & IR Platform</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] uppercase font-mono tracking-widest text-slate-400">
          Operations & Detection
        </div>
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}

        <div className="px-3 pt-4 pb-1 text-[10px] uppercase font-mono tracking-widest text-slate-400">
          Analysis & Engineering
        </div>
        {navItems.slice(5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Lab Environment Status Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${wsConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-red-400'}`} />
            <div>
              <p className="text-xs font-mono font-semibold text-slate-200">
                {wsConnected ? "Telemetry Live" : "Reconnecting"}
              </p>
              <p className="text-[10px] text-slate-400">WebSocket / Lab Engine</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30">
            v1.0
          </span>
        </div>
      </div>
    </aside>
  );
};
