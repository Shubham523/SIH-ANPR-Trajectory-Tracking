import React, { useState, useEffect } from 'react';
import WaypointTimeline from '../components/WaypointTimeline';
import { Search, RotateCcw, Filter, MapPin } from 'lucide-react';
import { api } from '../services/api';

export default function SearchView({ onPlotOnMap }) {
  const [plateQuery, setPlateQuery] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [waypoints, setWaypoints] = useState([]);

  // Load initial vehicle search results
  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async (overridePlate = null) => {
    setLoading(true);
    try {
      const queryPlate = overridePlate !== null ? overridePlate : plateQuery;
      const data = await api.searchTrajectories({
        plate: queryPlate || undefined,
        vehicleType: vehicleTypeFilter || undefined,
        limit: 50
      });
      setResults(data);

      // Auto-select first result if available
      if (data.length > 0) {
        handleSelectVehicle(data[0]);
      } else {
        setSelectedVehicle(null);
        setWaypoints([]);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVehicle = async (vehicle) => {
    setSelectedVehicle(vehicle);
    try {
      const traj = await api.getTrajectory(vehicle.global_id);
      setWaypoints(traj.waypoints || []);
    } catch (err) {
      console.error('Error fetching waypoints:', err);
    }
  };

  const handleQuickPreset = (plate) => {
    setPlateQuery(plate);
    handleSearch(plate);
  };

  const handleClear = () => {
    setPlateQuery('');
    setVehicleTypeFilter('');
    handleSearch('');
  };

  return (
    <div className="flex flex-col h-full p-4 overflow-hidden select-none bg-slate-100">
      {/* Top Pane: Query Form */}
      <div className="bg-white border border-slate-400 p-4 mb-4 flex flex-wrap gap-4 items-end shadow-hard-sm">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            License Plate Number (FR-07)
          </label>
          <input
            type="text"
            placeholder="e.g. HR-26-DK-9921 or DL-01"
            value={plateQuery}
            onChange={(e) => setPlateQuery(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full border border-slate-400 rounded-none p-2 font-mono uppercase text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
          />
        </div>

        <div className="w-48">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Vehicle Class Filter
          </label>
          <select
            value={vehicleTypeFilter}
            onChange={(e) => setVehicleTypeFilter(e.target.value)}
            className="w-full border border-slate-400 rounded-none p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
          >
            <option value="">All Classes</option>
            <option value="car">Sedan / Car</option>
            <option value="suv">SUV</option>
            <option value="bus">Bus</option>
            <option value="hatchback">Hatchback</option>
            <option value="cab">Cab / Auto</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleSearch()}
            className="bg-slate-900 hover:bg-black text-white font-bold px-6 py-2 border border-slate-950 text-sm flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search Trajectory
          </button>
          <button
            onClick={handleClear}
            className="bg-white hover:bg-slate-100 text-slate-800 font-bold px-4 py-2 border border-slate-400 text-sm flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            Clear
          </button>
        </div>

        {/* Quick Presets */}
        <div className="w-full flex items-center gap-2 pt-2 border-t border-slate-200 text-xs font-mono">
          <span className="text-slate-500 font-bold uppercase">Quick Demo Presets:</span>
          {['HR-26-DK-9921', 'DL-01-AB-1234', 'UP-16-XY-4321', 'MH-02-CD-5678'].map((preset) => (
            <button
              key={preset}
              onClick={() => handleQuickPreset(preset)}
              className="bg-slate-100 hover:bg-yellow-100 border border-slate-300 px-2 py-0.5 text-slate-800 font-bold"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Middle Pane: Results Table */}
      <div className="flex-1 overflow-y-auto bg-white border border-slate-400 shadow-hard-sm min-h-[160px]">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-200 border-b border-slate-400 text-slate-900 text-xs uppercase font-bold">
            <tr>
              <th className="p-2 border-r border-slate-300">Plate Number (OCR)</th>
              <th className="p-2 border-r border-slate-300">Global ID</th>
              <th className="p-2 border-r border-slate-300">Vehicle Description</th>
              <th className="p-2 border-r border-slate-300">Latest Camera</th>
              <th className="p-2 border-r border-slate-300">Last Seen</th>
              <th className="p-2 text-center">Hops Recorded</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="p-6 text-center text-slate-500 font-mono">
                  QUERYING TRAJECTORY DATABASE...
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-6 text-center text-slate-400 font-mono">
                  NO VEHICLES FOUND MATCHING SEARCH CRITERIA
                </td>
              </tr>
            ) : (
              results.map((r) => {
                const isSelected = selectedVehicle?.global_id === r.global_id;
                return (
                  <tr
                    key={r.global_id}
                    onClick={() => handleSelectVehicle(r)}
                    className={`border-b border-slate-200 cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-yellow-100 font-semibold'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="p-2 border-r border-slate-200 font-mono font-bold">
                      <span className="bg-yellow-200 px-1.5 py-0.5 border border-yellow-400 text-black">
                        {r.primary_plate}
                      </span>
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-700">
                      {r.global_id}
                    </td>
                    <td className="p-2 border-r border-slate-200 capitalize">
                      {r.vehicle_color} {r.vehicle_type}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono">
                      {r.latest_camera_id} ({r.latest_camera_name})
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-600">
                      {r.last_seen_str}
                    </td>
                    <td className="p-2 text-center font-mono font-bold">
                      {r.total_detections}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Pane: Visual Waypoint Timeline */}
      <div className="mt-4">
        <WaypointTimeline
          waypoints={waypoints}
          selectedGlobalId={selectedVehicle?.global_id}
          onViewOnMap={(wps) => {
            if (onPlotOnMap && selectedVehicle) {
              onPlotOnMap(selectedVehicle);
            }
          }}
        />
      </div>
    </div>
  );
}
