import React, { useEffect, useRef } from 'react';
import { Camera, Maximize2 } from 'lucide-react';

export default function CameraNode({ camera, activeVehicles = [] }) {
  const canvasRef = useRef(null);

  // Animated canvas simulating live CCTV feed with YOLO/ByteTrack tracking boxes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let frame = 0;

    const render = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      // Dark asphalt / CCTV tone background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Road lane markings
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(w * 0.35, 0);
      ctx.lineTo(w * 0.35, h);
      ctx.moveTo(w * 0.65, 0);
      ctx.lineTo(w * 0.65, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Camera ID Watermark & Timestamp
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`REC [${camera.id}] ${camera.name.toUpperCase()}`, 10, 18);
      ctx.fillText(new Date().toISOString().substring(11, 19), w - 65, 18);

      // Simulate vehicle in transit through FOV
      const speedFactor = (camera.fps || 30) / 30;
      const progress = ((frame * 1.5 * speedFactor) % (h + 100)) - 50;

      // Bounding Box Coordinates
      const bx = w * 0.4;
      const by = progress;
      const bw = 85;
      const bh = 55;

      if (by > -60 && by < h + 20) {
        // Vehicle Body
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(bx, by, bw, bh);

        // Bounding Box (YOLO Green)
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, bw, bh);

        // Corner brackets
        const cl = 6;
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        // Top-left
        ctx.beginPath(); ctx.moveTo(bx, by + cl); ctx.lineTo(bx, by); ctx.lineTo(bx + cl, by); ctx.stroke();
        // Top-right
        ctx.beginPath(); ctx.moveTo(bx + bw - cl, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cl); ctx.stroke();
        // Bottom-left
        ctx.beginPath(); ctx.moveTo(bx, by + bh - cl); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cl, by + bh); ctx.stroke();
        // Bottom-right
        ctx.beginPath(); ctx.moveTo(bx + bw - cl, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cl); ctx.stroke();

        // Local Track ID & Class Tag
        ctx.fillStyle = '#10b981';
        ctx.fillRect(bx, by - 14, 65, 14);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillText('CAR #' + ((frame % 500) + 10), bx + 3, by - 3);

        // License Plate Tag
        ctx.fillStyle = '#fef08a'; // yellow-200
        ctx.fillRect(bx + 10, by + bh - 12, 65, 12);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 8px "JetBrains Mono", monospace';
        ctx.fillText('HR-26-DK-9921', bx + 12, by + bh - 3);
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [camera]);

  return (
    <div className="bg-white border border-slate-400 flex flex-col select-none">
      {/* Header */}
      <div className="bg-slate-100 border-b border-slate-300 p-2 flex justify-between items-center text-sm font-bold">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-none border ${
              camera.status === 'online'
                ? 'bg-emerald-500 border-emerald-700'
                : 'bg-red-500 border-red-700'
            }`}
          />
          <span className="font-mono text-slate-800">{camera.id}</span>
          <span className="text-slate-500 text-xs font-normal">| {camera.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500">
            {camera.lat.toFixed(4)}, {camera.lon.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Video Container */}
      <div className="aspect-video bg-black relative overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={320}
          height={180}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[9px] font-mono px-1.5 py-0.5 border border-slate-700">
          RTSP LIVE
        </div>
      </div>

      {/* Footer Stats Grid */}
      <div className="grid grid-cols-3 gap-px bg-slate-300 border-t border-slate-400 text-center text-xs font-mono">
        <div className="bg-white py-1">
          <span className="text-slate-400 text-[10px] block">FPS</span>
          <span className="font-bold text-slate-800">{camera.fps || 29.8}</span>
        </div>
        <div className="bg-white py-1">
          <span className="text-slate-400 text-[10px] block">TOTAL HITS</span>
          <span className="font-bold text-slate-800">{camera.total_hits || 0}</span>
        </div>
        <div className="bg-white py-1">
          <span className="text-slate-400 text-[10px] block">DROPPED</span>
          <span className={`font-bold ${camera.dropped_frames > 0 ? 'text-red-600' : 'text-slate-600'}`}>
            {camera.dropped_frames || 0}
          </span>
        </div>
      </div>
    </div>
  );
}
