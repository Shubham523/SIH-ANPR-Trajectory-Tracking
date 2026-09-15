import React, { useState } from 'react';
import CameraNode from '../components/CameraNode';
import AddCameraModal from '../components/AddCameraModal';
import { Plus, Video, CheckCircle2 } from 'lucide-react';

export default function CamerasView({ cameras = [], onAddCamera }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-4 h-full overflow-y-auto select-none bg-slate-100 flex flex-col">
      {/* Top Header Bar */}
      <div className="bg-white border border-slate-400 p-3 flex justify-between items-center shadow-hard-sm">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-white p-1.5">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-slate-900 uppercase tracking-tight">
              Camera Grid Monitoring (FR-01, FR-08)
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              REAL-TIME RTSP/STREAM INGESTION & LOCAL TRACKER STATUS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-50 px-2 py-1 border border-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{cameras.length} NODES ACTIVE</span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-1.5 px-4 border border-slate-900 text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Camera Node
          </button>
        </div>
      </div>

      {/* Grid of Cameras */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
        {cameras.map((cam) => (
          <CameraNode key={cam.id} camera={cam} />
        ))}
      </div>

      {/* Add Camera Modal */}
      <AddCameraModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddCamera={onAddCamera}
      />
    </div>
  );
}
