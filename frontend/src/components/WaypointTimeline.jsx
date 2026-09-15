import React from 'react';
import { ArrowRight, MapPin, Gauge } from 'lucide-react';

export default function WaypointTimeline({ waypoints = [], selectedGlobalId, onViewOnMap }) {
  if (!waypoints || waypoints.length === 0) {
    return (
      <div className="h-28 bg-white border border-slate-400 p-4 flex items-center justify-center text-slate-400 font-mono text-xs">
        SELECT A VEHICLE FROM THE TABLE TO INSPECT ITS CHRONOLOGICAL MULTI-CAMERA TRAJECTORY TIMELINE
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-400 p-3 flex flex-col gap-2 select-none">
      {/* Header bar */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase text-slate-700">Chronological Trajectory Path</span>
          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 border border-slate-300">
            {selectedGlobalId}
          </span>
          <span className="font-mono text-xs text-slate-500">
            ({waypoints.length} Camera {waypoints.length === 1 ? 'Hop' : 'Hops'})
          </span>
        </div>
        {onViewOnMap && (
          <button
            onClick={() => onViewOnMap(waypoints)}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-1 px-3 border border-slate-950 flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5" />
            PLOT ON GIS MAP
          </button>
        )}
      </div>

      {/* Horizontal Waypoints Nodes */}
      <div className="overflow-x-auto py-2">
        <div className="flex items-center min-w-max gap-1">
          {waypoints.map((wp, index) => {
            const isFirst = index === 0;
            const isLast = index === waypoints.length - 1;

            return (
              <React.Fragment key={wp.id || index}>
                {/* Connecting Line with Speed */}
                {!isFirst && (
                  <div className="flex flex-col items-center px-1">
                    <span className="text-[9px] font-mono text-slate-500 mb-0.5">
                      {wp.speed_from_prev_kmh ? `${wp.speed_from_prev_kmh} km/h` : 'Transit'}
                    </span>
                    <div className="w-12 h-0.5 bg-slate-900 relative flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 text-slate-900 absolute right-0 -top-1.5" />
                    </div>
                  </div>
                )}

                {/* Waypoint Node Card */}
                <div className="border border-slate-400 bg-slate-50 p-2 w-44 flex flex-col gap-1 shadow-hard-sm">
                  {/* Step & Time */}
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="bg-slate-800 text-white px-1 font-bold">
                      HOP #{index + 1}
                    </span>
                    <span className="text-slate-600 font-semibold">{wp.iso_time}</span>
                  </div>

                  {/* Camera Node */}
                  <div className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-1">
                    {wp.camera_id}
                    <span className="text-[10px] font-normal text-slate-500 block truncate">
                      {wp.camera_name}
                    </span>
                  </div>

                  {/* Plate / Re-ID */}
                  <div className="flex justify-between items-center text-[10px] font-mono pt-0.5">
                    <span className="bg-yellow-200 px-1 py-0.2 border border-yellow-400 text-black font-bold">
                      {wp.plate_text}
                    </span>
                    <span
                      className={`text-[8px] px-1 py-0.2 border ${
                        wp.match_type === 'REID_FALLBACK'
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {wp.match_type}
                    </span>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
