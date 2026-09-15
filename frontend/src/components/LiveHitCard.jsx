import React from 'react';
import { ShieldAlert, Gauge, MapPin } from 'lucide-react';

export default function LiveHitCard({ hit, onSelect, isSelected = false }) {
  const isOccluded = !hit.plate_text || hit.plate_text === 'OCCLUDED';
  const isBlacklisted = hit.is_blacklisted === 1 || hit.is_blacklisted === true;
  const isSpeeding = hit.is_speeding === 1 || hit.is_speeding === true || (hit.speed_kmh && hit.speed_limit && hit.speed_kmh > hit.speed_limit);

  return (
    <div
      onClick={() => onSelect && onSelect(hit)}
      className={`border p-2 text-xs flex flex-col gap-1.5 cursor-pointer transition-none relative ${
        isBlacklisted
          ? 'bg-red-50 border-red-600 shadow-hard-sm'
          : isSelected
          ? 'bg-yellow-50 border-slate-900 shadow-hard-sm'
          : 'bg-slate-50 hover:bg-slate-100 border-slate-300'
      }`}
    >
      {/* Row 1: Timestamp & Camera ID & Area */}
      <div className="flex justify-between items-center font-mono text-slate-600 font-semibold text-[11px]">
        <span className="text-slate-900">{hit.time_str || hit.iso_time || 'LIVE'}</span>
        <span className="text-slate-800 bg-slate-200 px-1 border border-slate-300 font-bold">
          {hit.camera_id}
        </span>
      </div>

      {/* Physical Area Badge */}
      <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-800 bg-cyan-50 px-1.5 py-0.5 border border-cyan-200">
        <MapPin className="w-3 h-3 text-cyan-600" />
        <span className="truncate">{hit.area_name || hit.latest_area || 'Delhi NCR'}</span>
      </div>

      {/* Row 2: License Plate Number */}
      <div
        className={`font-mono font-bold text-center py-1 border ${
          isBlacklisted
            ? 'bg-red-600 border-red-800 text-white text-sm tracking-wider animate-pulse'
            : isOccluded
            ? 'bg-amber-100 border-amber-300 text-amber-900 tracking-wider'
            : 'bg-yellow-200 border-yellow-400 text-black text-sm tracking-wider'
        }`}
      >
        {hit.plate_text || 'OCCLUDED (RE-ID)'}
      </div>

      {/* Blacklist Warning Ribbon if applicable */}
      {isBlacklisted && (
        <div className="bg-red-900 text-red-100 text-[10px] font-mono font-bold px-1.5 py-0.5 border border-red-700 flex items-center gap-1 uppercase">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span className="truncate">{hit.blacklist_reason || 'HOTLISTED VEHICLE DETECTED'}</span>
        </div>
      )}

      {/* Overspeeding Warning Banner if applicable */}
      {isSpeeding && (
        <div className="bg-amber-100 text-amber-900 text-[10px] font-mono font-bold px-1.5 py-0.5 border border-amber-400 flex items-center gap-1">
          <Gauge className="w-3.5 h-3.5 text-amber-700" />
          <span>SPEED VIOLATION: {hit.speed_kmh} KM/H (LIMIT {hit.speed_limit || 60})</span>
        </div>
      )}

      {/* Row 3: Global ID & Match Type */}
      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
        <span className="font-semibold text-slate-700">{hit.global_id}</span>
        <span
          className={`px-1 py-0.2 border text-[9px] font-bold ${
            hit.match_type === 'EXACT_PLATE'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : hit.match_type === 'REID_FALLBACK'
              ? 'bg-purple-100 text-purple-800 border-purple-300'
              : hit.match_type === 'FUZZY_PLATE'
              ? 'bg-blue-100 text-blue-800 border-blue-300'
              : 'bg-slate-200 text-slate-700 border-slate-300'
          }`}
        >
          {hit.match_type || 'DETECTION'}
        </span>
      </div>

      {/* Vehicle Description & Speed Telemetry */}
      <div className="flex justify-between text-[10px] text-slate-600 font-mono border-t border-slate-200 pt-1">
        <span className="capitalize">{hit.vehicle_color} {hit.vehicle_type}</span>
        {hit.speed_kmh !== undefined && hit.speed_kmh !== null && (
          <span className={`font-bold ${isSpeeding ? 'text-red-600 font-black' : 'text-slate-700'}`}>
            {hit.speed_kmh} km/h
          </span>
        )}
      </div>
    </div>
  );
}

