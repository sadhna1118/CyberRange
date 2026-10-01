import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Terminal, 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  ExternalLink, 
  Zap, 
  Layers, 
  Clock, 
  Crosshair,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import { AttackScenario, SimulationResult } from '../types';
import MitreTag from '../components/MitreTag';
import { Link } from 'react-router-dom';

export default function SimulationsPage() {
  const [scenarios, setScenarios] = useState<AttackScenario[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [runningScenarioId, setRunningScenarioId] = useState<string | null>(null);
  const [activeSimulationResult, setActiveSimulationResult] = useState<SimulationResult | null>(null);
  const [progressStage, setProgressStage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    setIsLoading(true);
    try {
      const res = await api.simulations.getAll();
      setScenarios(res.data);
    } catch (err) {
      console.error('Failed to load attack scenarios:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSimulation = async (scenarioId: string) => {
    setRunningScenarioId(scenarioId);
    setActiveSimulationResult(null);
    setErrorMsg(null);
    setProgressStage('Initializing synthetic lab target & telemetry emitters...');

    try {
      setTimeout(() => setProgressStage('Executing synthetic attack stages against localhost...'), 400);
      setTimeout(() => setProgressStage('Normalizing emitted logs and evaluating detection rules...'), 900);
      setTimeout(() => setProgressStage('Correlating triggered alerts into incident workflow...'), 1400);

      const res = await api.simulations.run(scenarioId);
      
      setTimeout(() => {
        setActiveSimulationResult(res.data);
        setRunningScenarioId(null);
        setProgressStage('');
      }, 1600);
    } catch (err: any) {
      console.error('Simulation execution failed:', err);
      setErrorMsg(err?.response?.data?.detail || 'Simulation execution failed.');
      setRunningScenarioId(null);
      setProgressStage('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            Attack Simulation Lab
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Safely execute synthetic attack scenarios against isolated lab targets to test SOC detection pipelines, correlation rules, and triage playbooks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-emerald-950/40 border border-emerald-800/80 rounded-lg text-xs font-mono text-emerald-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Lab Status: ISOLATED LOCALHOST
          </div>
        </div>
      </div>

      {/* Safety Banner */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-200">Safe Defensive Simulation Notice:</strong> All attack scenarios generate synthetic telemetry directed solely toward localhost lab targets. No destructive payloads, malware deployment, or outbound network traffic are produced.
        </div>
      </div>

      {/* Progress Card when Running */}
      {runningScenarioId && (
        <div className="cyber-card p-6 border-amber-500/50 bg-amber-950/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400 animate-spin">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Simulation in Progress: <span className="text-amber-400">{runningScenarioId}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{progressStage}</p>
              </div>
            </div>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-cyan-500 h-2 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {/* Simulation Result Modal / Card */}
      {activeSimulationResult && (
        <div className="cyber-card p-6 border-emerald-500/50 bg-emerald-950/10 space-y-5 animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-400">EXECUTION COMPLETE</span>
                  <span className="text-xs text-slate-500">&bull;</span>
                  <span className="text-xs font-mono text-slate-400">{activeSimulationResult.scenario_id}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-100">{activeSimulationResult.scenario_name}</h2>
              </div>
            </div>

            {activeSimulationResult.incident_id && (
              <Link
                to={`/incidents/${activeSimulationResult.incident_id}`}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-cyan-950/40"
              >
                Investigate Incident <ExternalLink className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Result Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 uppercase">Duration</div>
              <div className="text-lg font-mono font-bold text-slate-200 mt-0.5">
                {activeSimulationResult.duration_seconds.toFixed(2)}s
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 uppercase">Events Emitted</div>
              <div className="text-lg font-mono font-bold text-cyan-400 mt-0.5">
                {activeSimulationResult.events_generated}
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 uppercase">Detections</div>
              <div className="text-lg font-mono font-bold text-blue-400 mt-0.5">
                {activeSimulationResult.detections_triggered}
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 uppercase">Alerts Raised</div>
              <div className="text-lg font-mono font-bold text-amber-400 mt-0.5">
                {activeSimulationResult.alerts_generated}
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 uppercase">Incidents</div>
              <div className="text-lg font-mono font-bold text-rose-400 mt-0.5">
                {activeSimulationResult.incidents_created}
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 uppercase">Risk Score</div>
              <div className="text-lg font-mono font-bold text-rose-400 mt-0.5">
                {activeSimulationResult.risk_score} / 100
              </div>
            </div>
          </div>

          {/* Triggered Rules & MITRE Techniques */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Triggered Defensive Rules
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeSimulationResult.rules_matched.map((r) => (
                  <span key={r} className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-cyan-300">
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Mapped MITRE Techniques
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeSimulationResult.mitre_techniques.map((t) => (
                  <MitreTag key={t} techniqueId={t} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full cyber-card p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading attack simulation scenarios...
          </div>
        ) : (
          scenarios.map((scenario) => {
            const isCurrentlyRunning = runningScenarioId === scenario.id;
            return (
              <div 
                key={scenario.id} 
                className="cyber-card p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all border border-slate-800 bg-slate-900/50"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      {scenario.id}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> ~{scenario.stages?.length || 3} stages
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-100">{scenario.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-3">
                      {scenario.description}
                    </p>
                  </div>

                  {/* Stages Pills */}
                  {scenario.stages && (
                    <div className="space-y-1.5 pt-2">
                      <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                        Attack Stages Sequence
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {scenario.stages.map((st, i) => (
                          <span key={i} className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-300 font-mono border border-slate-800">
                            {st.name || st}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expected MITRE Techniques */}
                  {scenario.expected_mitre && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                        Expected MITRE Techniques
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {scenario.expected_mitre.map((m) => (
                          <span key={m} className="text-[10px] bg-amber-950/40 text-amber-300 px-1.5 py-0.5 rounded font-mono border border-amber-800/40">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/80">
                  <button
                    onClick={() => handleRunSimulation(scenario.id)}
                    disabled={runningScenarioId !== null}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-40 shadow-md shadow-cyan-950/30"
                  >
                    <Play className={`w-3.5 h-3.5 ${isCurrentlyRunning ? 'animate-spin' : ''}`} />
                    {isCurrentlyRunning ? 'Simulating...' : 'Run Simulation'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
