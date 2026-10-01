import React from "react";

interface RiskGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, size = "md", showLabel = true }) => {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  const getColor = (s: number) => {
    if (s >= 90) return { bg: "bg-red-500", text: "text-red-400", border: "border-red-500", ring: "stroke-red-500", label: "Critical" };
    if (s >= 75) return { bg: "bg-orange-500", text: "text-orange-400", border: "border-orange-500", ring: "stroke-orange-500", label: "High" };
    if (s >= 50) return { bg: "bg-yellow-500", text: "text-yellow-400", border: "border-yellow-500", ring: "stroke-yellow-500", label: "Medium" };
    if (s >= 25) return { bg: "bg-blue-500", text: "text-blue-400", border: "border-blue-500", ring: "stroke-blue-500", label: "Low" };
    return { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500", ring: "stroke-emerald-500", label: "Info" };
  };

  const style = getColor(clampedScore);

  if (size === "sm") {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
          <div className={`h-full ${style.bg}`} style={{ width: `${clampedScore}%` }} />
        </div>
        <span className={`text-xs font-mono font-bold ${style.text}`}>{clampedScore}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-14 h-14 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-slate-800 stroke-current"
            strokeWidth="3.5"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className={`${style.ring} stroke-current transition-all duration-1000 ease-out`}
            strokeDasharray={`${clampedScore}, 100`}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute text-center">
          <span className={`text-sm font-mono font-bold ${style.text}`}>{clampedScore}</span>
        </div>
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Risk Score</span>
          <span className={`text-xs font-bold uppercase ${style.text}`}>{style.label} Risk</span>
        </div>
      )}
    </div>
  );
};
