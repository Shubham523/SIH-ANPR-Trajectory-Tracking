import React, { useEffect, useRef } from 'react';
import { Camera, Maximize2 } from 'lucide-react';

export default function CameraNode({ camera, onInspect }) {
  const canvasRef = useRef(null);

  // Define unique vehicle signatures per camera for realistic live multi-stream simulation
  const CAM_VEHICLES = {
    'CAM-DEL-01': { plate: 'HR-26-DK-9921', type: 'SUV', color: '#64748b', speed: 48, isBl: false, isSpd: false, desc: 'SILVER SUV' },
    'CAM-DEL-02': { plate: 'DL-01-AB-1234', type: 'SUV', color: '#1e1b4b', speed: 54, isBl: true, blReason: 'STOLEN SUV - FIR #402', isSpd: false, desc: 'BLACK SUV' },
    'CAM-DEL-03': { plate: 'KA-03-GH-3456', type: 'CAB', color: '#eab308', speed: 38, isBl: true, blReason: 'INTER-STATE SUSPECT', isSpd: false, desc: 'YELLOW CAB' },
    'CAM-DEL-04': { plate: 'DL-08-EF-9012', type: 'BUS', color: '#dc2626', speed: 35, isBl: false, isSpd: false, desc: 'RED BUS' },
    'CAM-DEL-05': { plate: 'UP-16-XY-4321', type: 'SEDAN', color: '#b91c1c', speed: 94, isBl: false, isSpd: true, desc: 'RED SEDAN' },
    'CAM-DEL-06': { plate: 'MH-02-CD-5678', type: 'SEDAN', color: '#2563eb', speed: 76, isBl: false, isSpd: false, desc: 'BLUE SEDAN' }
  };

  const defaultV = { plate: 'HR-26-DK-9921', type: 'CAR', color: '#334155', speed: 45, isBl: false, isSpd: false, desc: 'WHITE CAR' };
  const vSpec = CAM_VEHICLES[camera?.id] || defaultV;

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

      // CCTV Night / Asphalt Tone Background
      ctx.fillStyle = vSpec.isBl ? '#110505' : '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Perspective Road Lanes
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(w * 0.35, 0); ctx.lineTo(w * 0.25, h);
      ctx.moveTo(w * 0.65, 0); ctx.lineTo(w * 0.75, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Top Header Info Overlay
      const camIdStr = camera?.id || 'CAM';
      const camNameStr = (camera?.name || 'CCTV NODE').toUpperCase();
      ctx.fillStyle = vSpec.isBl ? '#ef4444' : '#00ffcc';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText(`REC [${camIdStr}] ${camNameStr.substring(0, 18)}`, 8, 14);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(new Date().toISOString().substring(11, 19), w - 55, 14);


      // Zone & Speed Limit Tag
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 8px "JetBrains Mono", monospace';
      ctx.fillText(`ZONE: ${(camera.area || 'DELHI NCR').toUpperCase()}`, 8, 25);

      // Vehicle Movement Animation
      const speedFactor = (camera.fps || 30) / 30;
      const progress = ((frame * (vSpec.isSpd ? 2.5 : 1.6) * speedFactor) % (h + 90)) - 45;

      const bx = w * 0.36;
      const by = progress;
      const bw = 95;
      const bh = 55;

      if (by > -50 && by < h + 15) {
        const boxColor = vSpec.isBl ? '#ef4444' : vSpec.isSpd ? '#f59e0b' : '#10b981';

        // Vehicle Chassis
        ctx.fillStyle = vSpec.color;
        ctx.fillRect(bx, by, bw, bh);

        // Bounding Box
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 1.8;
        ctx.strokeRect(bx, by, bw, bh);

        // YOLO Brackets
        const cl = 6;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        // TL
        ctx.beginPath(); ctx.moveTo(bx, by + cl); ctx.lineTo(bx, by); ctx.lineTo(bx + cl, by); ctx.stroke();
        // TR
        ctx.beginPath(); ctx.moveTo(bx + bw - cl, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cl); ctx.stroke();
        // BL
        ctx.beginPath(); ctx.moveTo(bx, by + bh - cl); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cl, by + bh); ctx.stroke();
        // BR
        ctx.beginPath(); ctx.moveTo(bx + bw - cl, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cl); ctx.stroke();

        // Banner Tag Above Box
        ctx.fillStyle = boxColor;
        ctx.fillRect(bx, by - 14, bw, 14);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 8px "JetBrains Mono", monospace';
        const tagTitle = vSpec.isBl ? 'ALERT: BLACKLISTED' : vSpec.isSpd ? `SPEEDING: ${vSpec.speed}KM/H` : `YOLO: ${vSpec.desc}`;
        ctx.fillText(tagTitle, bx + 3, by - 4);

        // License Plate Box
        ctx.fillStyle = vSpec.isBl ? '#ef4444' : '#fef08a';
        ctx.fillRect(bx + 8, by + bh - 12, 78, 12);
        ctx.fillStyle = vSpec.isBl ? '#ffffff' : '#000000';
        ctx.font = 'bold 8px "JetBrains Mono", monospace';
        ctx.fillText(vSpec.plate, bx + 10, by + bh - 3);
      }

      // OCR Live Crop Watermark Overlay (Bottom Right)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(w - 95, h - 22, 90, 18);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(w - 95, h - 22, 90, 18);
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 8px "JetBrains Mono", monospace';
      ctx.fillText(`OCR: ${vSpec.plate}`, w - 90, h - 9);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [camera, vSpec]);

  return (
    <div className={`bg-white border flex flex-col select-none shadow-hard-sm ${
      vSpec.isBl ? 'border-red-600' : vSpec.isSpd ? 'border-amber-500' : 'border-slate-400'
    }`}>
      {/* Header */}
      <div className={`p-2 flex justify-between items-center text-xs font-bold border-b ${
        vSpec.isBl ? 'bg-red-100 border-red-300 text-red-950' : 'bg-slate-100 border-slate-300 text-slate-900'
      }`}>
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-none border ${
              vSpec.isBl
                ? 'bg-red-600 border-red-800 animate-pulse'
                : 'bg-emerald-500 border-emerald-700'
            }`}
          />
          <span className="font-mono">{camera.id}</span>
          <span className="text-slate-600 font-normal truncate max-w-[110px]">{camera.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="bg-cyan-100 text-cyan-900 text-[10px] px-1.5 py-0.5 border border-cyan-300 font-mono">
            {camera.area || 'Delhi NCR'}
          </span>
          <button
            onClick={() => onInspect && onInspect(camera)}
            className="p-1 hover:bg-slate-200 border border-slate-400 text-slate-700"
            title="Inspect Live Video Stream"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
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
        <div className="absolute top-2 right-2 bg-slate-900/90 text-emerald-400 text-[9px] font-mono px-1.5 py-0.5 border border-slate-700 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>RTSP LIVE</span>
        </div>

        {/* Speed Radar Overlay */}
        <div className={`absolute bottom-2 left-2 text-[9px] font-mono px-1.5 py-0.5 border font-bold ${
          vSpec.isSpd
            ? 'bg-red-600 text-white border-red-800 animate-pulse'
            : 'bg-slate-900/90 text-yellow-300 border-slate-700'
        }`}>
          RADAR: {vSpec.speed} KM/H (LIMIT {camera.speed_limit || 60})
        </div>
      </div>

      {/* Footer Stats Grid */}
      <div className="grid grid-cols-3 gap-px bg-slate-300 border-t border-slate-400 text-center text-xs font-mono">
        <div className="bg-white py-1">
          <span className="text-slate-400 text-[10px] block">FPS</span>
          <span className="font-bold text-slate-800">{camera.fps || 29.8}</span>
        </div>
        <div className="bg-white py-1">
          <span className="text-slate-400 text-[10px] block">SCANS</span>
          <span className="font-bold text-emerald-700">{camera.total_hits || 0}</span>
        </div>
        <div className="bg-white py-1">
          <span className="text-slate-400 text-[10px] block">STATUS</span>
          <span className={`font-bold ${vSpec.isBl ? 'text-red-600' : vSpec.isSpd ? 'text-amber-600' : 'text-slate-700'}`}>
            {vSpec.isBl ? 'HOTLIST' : vSpec.isSpd ? 'SPEEDING' : 'CLEAN'}
          </span>
        </div>
      </div>
    </div>
  );
}


