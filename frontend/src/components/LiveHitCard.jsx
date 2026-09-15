import React from 'react';

export default function LiveHitCard({ hit, onSelect, isSelected = false }) {
  const isOccluded = !hit.plate_text || hit.plate_text === 'OCCLUDED';

  return (
    <div
      onClick={() => onSelect && onSelect(hit)}
      className={`border p-2 text-xs flex flex-col gap-1 cursor-pointer transition-none ${
        isSelected
          ? 'bg-yellow-50 border-slate-900 shadow-hard-sm'
          : 'bg-slate-50 hover:bg-slate-100 border-slate-300'
      }`}
    >
      {/* Row 1: Timestamp & Camera ID */}
      <div className="flex justify-between font-mono text-slate-600 font-semibold text-[11px]">
        <span>{hit.time_str || hit.iso_time || 'LIVE'}</span>
        <span className="text-slate-800 bg-slate-200 px-1 border border-slate-300">
          {hit.camera_id}
        </span>
      </div>

      {/* Row 2: License Plate Number */}
      <div
        className={`font-mono font-bold text-center py-1 mt-0.5 border ${
          isOccluded
            ? 'bg-amber-100 border-amber-300 text-amber-900 tracking-wider'
            : 'bg-yellow-200 border-yellow-400 text-black text-sm tracking-wider'
        }`}
      >
        {hit.plate_text || 'OCCLUDED (RE-ID)'}
      </div>

      {/* Row 3: Global ID & Match Type */}
      <div className="flex justify-between items-center text-[10px] font-mono mt-1 text-slate-500">
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

      {/* Vehicle Type and Latency/Speed if available */}
      <div className="flex justify-between text-[10px] text-slate-500 font-mono border-t border-slate-200 pt-1">
        <span className="capitalize">{hit.vehicle_color} {hit.vehicle_type}</span>
        {hit.speed_kmh !== undefined && hit.speed_kmh !== null && (
          <span className="text-slate-700 font-bold">{hit.speed_kmh} km/h</span>
        )}
      </div>
    </div>
  );
}
