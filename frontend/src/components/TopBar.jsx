import React, { useState, useEffect } from 'react';
import { Shield, Radio, Activity } from 'lucide-react';

export default function TopBar({ wsConnected = true }) {
  const [serverTime, setServerTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setServerTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-10 w-full bg-slate-900 text-slate-50 flex items-center justify-between px-4 border-b border-slate-950 select-none z-50">
      {/* Left branding */}
      <div className="flex items-center gap-3">
        <div className="bg-slate-800 border border-slate-700 p-1 flex items-center justify-center">
          <Shield className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-tight text-sm uppercase">
            City-Wide AI Engine
          </span>
          <span className="text-slate-500 text-xs hidden sm:inline">|</span>
          <span className="text-slate-400 text-xs font-mono hidden sm:inline">
            SIH 26127 Trajectory Tracking
          </span>
        </div>
      </div>

      {/* Right Telemetry & Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400 border-r border-slate-800 pr-3">
          <Activity className="w-3.5 h-3.5 text-slate-400" />
          <span>{serverTime || 'SYNCING...'}</span>
        </div>

        <div className="flex items-center gap-2">
          {wsConnected ? (
            <span className="bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-white border border-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-none animate-pulse"></span>
              SYSTEM ONLINE
            </span>
          ) : (
            <span className="bg-amber-600 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-white border border-amber-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-none"></span>
              RECONNECTING
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
