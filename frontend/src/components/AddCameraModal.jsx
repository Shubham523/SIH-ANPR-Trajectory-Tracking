import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

export default function AddCameraModal({ isOpen, onClose, onAddCamera }) {
  const [cameraId, setCameraId] = useState('');
  const [name, setName] = useState('');
  const [lat, setLat] = useState('28.6300');
  const [lon, setLon] = useState('77.2200');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cameraId || !name) return;

    onAddCamera({
      id: cameraId.toUpperCase(),
      name,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      status: 'online',
      fps: 30.0,
      total_hits: 0,
      dropped_frames: 0,
      stream_url: `sim://${cameraId.toLowerCase()}`
    });

    setCameraId('');
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white border-2 border-slate-900 w-full max-w-md shadow-hard">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-2.5 flex justify-between items-center">
          <span className="font-bold text-sm uppercase">Add Camera Node (FR-08)</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Camera ID (Monospace)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CAM-N-05"
              value={cameraId}
              onChange={(e) => setCameraId(e.target.value)}
              className="w-full border border-slate-400 p-2 font-mono text-sm uppercase focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Location Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ring Road Junction 4"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-400 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Latitude (GIS)
              </label>
              <input
                type="number"
                step="0.0001"
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full border border-slate-400 p-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Longitude (GIS)
              </label>
              <input
                type="number"
                step="0.0001"
                required
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                className="w-full border border-slate-400 p-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-slate-100 text-slate-800 font-bold py-1.5 px-4 border border-slate-400 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-black text-white font-bold py-1.5 px-4 border border-slate-950 text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Register Node
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
