import React, { useEffect, useRef } from 'react';
import { X, ShieldAlert, Zap, Radio, MapPin, Gauge } from 'lucide-react';

export default function LiveCameraModal({ camera, onClose, liveHits = [] }) {
  const canvasRef = useRef(null);

  // Filter hits for this camera
  const cameraHits = liveHits.filter((h) => h.camera_id === camera?.id);
  const latestHit = cameraHits[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !camera) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let frame = 0;

    const render = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      // Dark asphalt background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Road grid perspective lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.moveTo(w * 0.3, 0); ctx.lineTo(w * 0.2, h);
      ctx.moveTo(w * 0.5, 0); ctx.lineTo(w * 0.5, h);
      ctx.moveTo(w * 0.7, 0); ctx.lineTo(w * 0.8, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Top Header Watermark
      const modalCamId = camera?.id || 'CAM';
      const modalCamName = (camera?.name || 'CCTV NODE').toUpperCase();
      ctx.fillStyle = '#00ffcc';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText(`LIVE STREAM [${modalCamId}] - ${modalCamName}`, 16, 26);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`AREA: ${camera?.area || 'DELHI NCR'} | SPEED LIMIT: ${camera?.speed_limit || 60} KM/H`, 16, 44);


      // Current ISO Timestamp
      ctx.fillStyle = '#f8fafc';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText(new Date().toISOString().replace('T', ' ').substring(0, 19), w - 210, 26);

      // Dynamic Vehicle Movement
      const progress = ((frame * 2.2) % (h + 120)) - 60;
      const bx = w * 0.42;
      const by = progress;
      const bw = 160;
      const bh = 90;

      if (by > -80 && by < h + 40) {
        const isBl = latestHit?.is_blacklisted || false;
        const isSpd = latestHit?.is_speeding || (frame % 200 > 120);

        // Bounding Box Colors
        const boxColor = isBl ? '#ef4444' : isSpd ? '#f59e0b' : '#10b981';

        // Vehicle Chassis
        ctx.fillStyle = isBl ? '#450a0a' : '#1e293b';
        ctx.fillRect(bx, by, bw, bh);

        // Outer Frame Bounding Box
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);

        // YOLO Brackets
        const cl = 12;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        // TL
        ctx.beginPath(); ctx.moveTo(bx, by + cl); ctx.lineTo(bx, by); ctx.lineTo(bx + cl, by); ctx.stroke();
        // TR
        ctx.beginPath(); ctx.moveTo(bx + bw - cl, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cl); ctx.stroke();
        // BL
        ctx.beginPath(); ctx.moveTo(bx, by + bh - cl); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cl, by + bh); ctx.stroke();
        // BR
        ctx.beginPath(); ctx.moveTo(bx + bw - cl, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cl); ctx.stroke();

        // Tag Banner Above Bbox
        ctx.fillStyle = boxColor;
        ctx.fillRect(bx, by - 22, bw, 22);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        const tagText = isBl ? 'CRITICAL: BLACKLISTED' : isSpd ? 'ALERT: SPEED VIOLATION' : 'YOLOv8: VEHICLE DETECTED';
        ctx.fillText(tagText, bx + 6, by - 6);

        // License Plate Box inside vehicle
        ctx.fillStyle = '#fef08a'; // yellow-200
        ctx.fillRect(bx + 20, by + bh - 24, 120, 20);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        const plateStr = latestHit?.plate_text || 'HR-26-DK-9921';
        ctx.fillText(`PLATE: ${plateStr}`, bx + 24, by + bh - 9);
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [camera, latestHit]);

  if (!camera) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border-2 border-slate-400 w-full max-w-5xl flex flex-col shadow-hard-lg overflow-hidden">
        {/* Modal Top Bar */}
        <div className="bg-slate-800 border-b border-slate-700 p-3 flex justify-between items-center text-white">
          <div className="flex items-center gap-3 font-mono text-sm font-bold">
            <span className="w-3 h-3 bg-red-600 animate-pulse"></span>
            <span className="text-emerald-400">{camera.id}</span>
            <span className="text-slate-300 font-normal">| {camera.name}</span>
            <span className="bg-slate-700 text-slate-300 px-2 py-0.5 text-xs font-normal border border-slate-600">
              {camera.area || 'Delhi NCR'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-red-600 hover:text-white transition-colors bg-slate-700 border border-slate-600 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-slate-800">
          {/* Main Video Player */}
          <div className="lg:col-span-2 aspect-video bg-black relative">
            <canvas ref={canvasRef} width={640} height={360} className="w-full h-full object-cover" />
            <div className="absolute top-3 right-3 bg-red-900/90 text-red-200 border border-red-500 text-xs font-mono px-2 py-1 flex items-center gap-1.5 animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              <span>LIVE RTSP INGESTION</span>
            </div>
          </div>

          {/* Right Metrics & Recent Scans Pane */}
          <div className="bg-slate-900 p-4 flex flex-col justify-between text-xs font-mono text-slate-300">
            <div>
              <div className="font-bold uppercase tracking-wider text-slate-100 border-b border-slate-800 pb-2 mb-3 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <span>Node Telemetry</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between bg-slate-800/80 p-2 border border-slate-700">
                  <span className="text-slate-400">FPS / Refresh:</span>
                  <span className="font-bold text-white">{camera.fps || 29.8} FPS</span>
                </div>
                <div className="flex justify-between bg-slate-800/80 p-2 border border-slate-700">
                  <span className="text-slate-400">Total Scans:</span>
                  <span className="font-bold text-emerald-400">{camera.total_hits || 0}</span>
                </div>
                <div className="flex justify-between bg-slate-800/80 p-2 border border-slate-700">
                  <span className="text-slate-400">Speed Limit:</span>
                  <span className="font-bold text-yellow-400">{camera.speed_limit || 60} KM/H</span>
                </div>
                <div className="flex justify-between bg-slate-800/80 p-2 border border-slate-700">
                  <span className="text-slate-400">Physical Zone:</span>
                  <span className="font-bold text-cyan-400">{camera.area || 'Delhi NCR'}</span>
                </div>
              </div>

              {/* Latest Live Hit for this camera */}
              <div className="mt-4">
                <div className="font-bold uppercase tracking-wider text-slate-100 border-b border-slate-800 pb-2 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Latest ANPR Detection</span>
                </div>

                {latestHit ? (
                  <div className="bg-slate-800 border border-slate-700 p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="bg-yellow-200 text-black font-bold px-2 py-0.5 border border-yellow-400 text-sm">
                        {latestHit.plate_text}
                      </span>
                      <span className="text-slate-400">{latestHit.time_str}</span>
                    </div>
                    <div className="text-slate-300">
                      <span>Vehicle: </span>
                      <span className="text-white capitalize">{latestHit.vehicle_color} {latestHit.vehicle_type}</span>
                    </div>
                    {latestHit.is_blacklisted ? (
                      <div className="bg-red-900/80 text-red-200 p-1.5 border border-red-500 font-bold flex items-center gap-1.5 text-[11px]">
                        <ShieldAlert className="w-4 h-4" />
                        <span>{latestHit.blacklist_reason || 'HOTLISTED VEHICLE'}</span>
                      </div>
                    ) : null}
                    {latestHit.is_speeding ? (
                      <div className="bg-amber-900/80 text-amber-200 p-1.5 border border-amber-500 font-bold text-[11px]">
                        SPEEDING: {latestHit.speed_kmh} KM/H (LIMIT {latestHit.speed_limit || 60})
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-slate-500 italic p-3 text-center bg-slate-800/40 border border-slate-800">
                    Awaiting camera detections...
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 text-center">
              SYSTEM ENCRYPTED RTSP STREAM | GPU PIPELINE OK
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
