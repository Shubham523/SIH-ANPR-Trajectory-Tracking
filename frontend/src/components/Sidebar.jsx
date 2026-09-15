import React from 'react';
import { Map, Video, Search, Cpu, Play, Square } from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, simulatorRunning, onToggleSimulator, liveHitCount = 0 }) {
  const navItems = [
    { id: 'dashboard', label: 'Live Map Dashboard', icon: Map },
    { id: 'cameras', label: 'Camera Grid Monitor', icon: Video },
    { id: 'search', label: 'Trajectory Search', icon: Search },
    { id: 'system', label: 'System Health & DevOps', icon: Cpu },
  ];

  return (
    <aside className="w-64 h-full bg-white border-r border-slate-300 flex flex-col justify-between select-none">
      {/* Navigation Stack */}
      <div className="flex flex-col">
        <div className="px-4 py-3 border-b border-slate-300 bg-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wider">
          Operations Console
        </div>
        <nav className="flex flex-col">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full text-left px-4 py-3 border-b border-slate-200 transition-none font-semibold text-sm flex items-center justify-between ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'dashboard' && liveHitCount > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold ${isActive ? 'bg-slate-700 text-emerald-300' : 'bg-slate-200 text-slate-800'}`}>
                    {liveHitCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Simulator Control & System Telemetry Footer */}
      <div className="p-3 border-t border-slate-300 bg-slate-50 flex flex-col gap-3">
        <div className="border border-slate-300 bg-white p-2.5">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Traffic Simulation Feed
          </div>
          <button
            onClick={onToggleSimulator}
            className={`w-full py-1.5 px-2 text-xs font-bold font-mono border flex items-center justify-center gap-2 ${
              simulatorRunning
                ? 'bg-red-600 hover:bg-red-700 text-white border-red-800'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-800'
            }`}
          >
            {simulatorRunning ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                PAUSE SIMULATION
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                START SIMULATION
              </>
            )}
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-500 flex justify-between border-t border-slate-200 pt-2">
          <span>GPU: RTX 3050 (6GB)</span>
          <span className="text-emerald-700 font-bold">FP16</span>
        </div>
      </div>
    </aside>
  );
}
