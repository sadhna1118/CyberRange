import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Flame, Bell, User as UserIcon, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

export const Topbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-[#0f141f]/90 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Global Search Bar */}
      <form onSubmit={handleSearch} className="relative w-96">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Global Search (IP, Host, User, Hash, MITRE ID)..."
          className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg pl-10 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/80 transition-all font-mono"
        />
      </form>

      {/* Action shortcuts & User Menu */}
      <div className="flex items-center gap-4">
        {/* Quick Simulation Trigger */}
        <button
          onClick={() => navigate("/simulations")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-xs font-bold shadow-lg shadow-red-900/30 transition-all cursor-pointer"
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Launch Attack Simulation</span>
        </button>

        {/* Notifications Icon with Badge */}
        <div className="relative cursor-pointer" onClick={() => navigate("/alerts")}>
          <div className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300">
            <Bell className="w-4 h-4" />
          </div>
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-mono font-bold text-white flex items-center justify-center animate-pulse">
              {notifications.length}
            </span>
          )}
        </div>

        {/* User Identity Pill */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xs font-mono">
            {user?.username?.substring(0, 2).toUpperCase() || "SA"}
          </div>
          <div className="hidden md:flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-200">{user?.username || "SOC Analyst"}</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 border border-cyan-500/30">
                {user?.role || "SOC_ANALYST"}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{user?.email || "analyst@cyberrange.lab"}</span>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-lg hover:bg-red-950/40 hover:text-red-400 text-slate-400 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
