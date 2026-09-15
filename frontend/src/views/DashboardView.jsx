import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import LiveHitCard from '../components/LiveHitCard';
import { Layers, Crosshair, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { api } from '../services/api';

export default function DashboardView({ cameras = [], liveHits = [], onSelectHit, selectedHit, onInspectVehicle }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const cameraLayerRef = useRef(null);
  const vehicleLayerRef = useRef(null);
  const trajectoryLayerRef = useRef(null);

  const [selectedTrajectory, setSelectedTrajectory] = useState(null);
  const [activeVehicles, setActiveVehicles] = useState([]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Centered around New Delhi city grid
    const map = L.map(mapRef.current, {
      center: [28.6295, 77.2185],
      zoom: 15,
      zoomControl: false,
    });

    // Clean, high-contrast utilitarian CartoDB Positron / OSM style
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    cameraLayerRef.current = L.layerGroup().addTo(map);
    vehicleLayerRef.current = L.layerGroup().addTo(map);
    trajectoryLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Camera Markers
  useEffect(() => {
    if (!cameraLayerRef.current) return;
    cameraLayerRef.current.clearLayers();

    cameras.forEach((cam) => {
      const camIcon = L.divIcon({
        className: 'camera-marker-icon',
        html: `<div>${cam.id.replace('CAM-', '')}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([cam.lat, cam.lon], { icon: camIcon })
        .bindPopup(`
          <div class="font-mono text-xs">
            <div class="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-1">
              [${cam.id}] ${cam.name}
            </div>
            <div>STATUS: <span class="font-bold text-emerald-700 uppercase">${cam.status}</span></div>
            <div>COORDINATES: ${cam.lat.toFixed(4)}, ${cam.lon.toFixed(4)}</div>
            <div>TOTAL HITS: ${cam.total_hits}</div>
            <div>FPS: ${cam.fps}</div>
          </div>
        `);

      cameraLayerRef.current.addLayer(marker);
    });
  }, [cameras]);

  // Fetch active vehicles periodically
  useEffect(() => {
    const fetchActive = async () => {
      try {
        const list = await api.getActiveTrajectories();
        setActiveVehicles(list);
      } catch (err) {
        console.error('Error fetching active vehicles:', err);
      }
    };
    fetchActive();
    const interval = setInterval(fetchActive, 2000);
    return () => clearInterval(interval);
  }, []);

  // Update Active Vehicle Markers
  useEffect(() => {
    if (!vehicleLayerRef.current) return;
    vehicleLayerRef.current.clearLayers();

    activeVehicles.forEach((v) => {
      const vIcon = L.divIcon({
        className: 'vehicle-marker-icon',
        html: `<div>${v.plate.substring(0, 4)}</div>`,
        iconSize: [36, 20],
        iconAnchor: [18, 10],
      });

      const marker = L.marker([v.lat, v.lon], { icon: vIcon })
        .bindPopup(`
          <div class="font-mono text-xs">
            <div class="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-1">
              ${v.plate} (${v.vehicle_color} ${v.vehicle_type})
            </div>
            <div>GLOBAL ID: <span class="font-bold">${v.global_id}</span></div>
            <div>LAST SEEN: ${v.last_camera_id} (${v.seconds_ago}s ago)</div>
          </div>
        `);

      vehicleLayerRef.current.addLayer(marker);
    });
  }, [activeVehicles]);

  // When a hit or vehicle is selected, fetch its full trajectory and plot polyline
  useEffect(() => {
    if (!selectedHit || !trajectoryLayerRef.current) return;

    const loadTrajectory = async () => {
      try {
        const data = await api.getTrajectory(selectedHit.global_id);
        setSelectedTrajectory(data);

        trajectoryLayerRef.current.clearLayers();
        if (data.waypoints && data.waypoints.length > 1) {
          const latlngs = data.waypoints.map((wp) => [wp.lat, wp.lon]);

          // Solid brutalist polyline (2px slate-900)
          const polyline = L.polyline(latlngs, {
            color: '#0f172a',
            weight: 3,
            dashArray: '6, 6',
          }).addTo(trajectoryLayerRef.current);

          // Fit bounds to show trajectory
          mapInstanceRef.current?.fitBounds(polyline.getBounds(), { padding: [40, 40] });
        }
      } catch (err) {
        console.error('Error plotting trajectory:', err);
      }
    };

    loadTrajectory();
  }, [selectedHit]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([28.6295, 77.2185], 15);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden select-none">
      {/* Left GIS Map Pane */}
      <div className="flex-1 relative h-full bg-slate-200">
        <div ref={mapRef} className="h-full w-full z-0" />

        {/* Map Header Floating Overlay */}
        <div className="absolute top-3 left-3 z-10 bg-white/95 border border-slate-400 p-2 shadow-hard flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-slate-900 inline-block"></span>
            <span className="font-bold">{cameras.length} CAMERAS</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-300 pl-3">
            <span className="w-2.5 h-2.5 bg-red-600 inline-block"></span>
            <span className="font-bold">{activeVehicles.length} ACTIVE TRACKS</span>
          </div>
          {selectedTrajectory && (
            <div className="border-l border-slate-300 pl-3 flex items-center gap-2">
              <span className="bg-yellow-200 px-1 font-bold border border-yellow-400">
                {selectedTrajectory.primary_plate}
              </span>
              <span className="text-slate-500">
                ({selectedTrajectory.total_hops} hops)
              </span>
            </div>
          )}
        </div>

        {/* Map Controls */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 shadow-hard">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="bg-white hover:bg-slate-100 p-1.5 border border-slate-400 font-bold"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-slate-800" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="bg-white hover:bg-slate-100 p-1.5 border border-slate-400 font-bold"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-slate-800" />
          </button>
          <button
            onClick={handleResetView}
            className="bg-white hover:bg-slate-100 p-1.5 border border-slate-400 font-bold"
            title="Reset Map Center"
          >
            <Crosshair className="w-4 h-4 text-slate-800" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 border border-slate-400 px-2 py-1 shadow-hard text-[10px] font-mono text-slate-700 flex gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-slate-900 inline-block border border-white"></span>
            <span>Camera Node</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-red-600 inline-block border border-white"></span>
            <span>Tracked Vehicle</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-slate-900 inline-block border-t border-dashed border-slate-900"></span>
            <span>Active Trajectory</span>
          </div>
        </div>
      </div>

      {/* Right Pane: Live ANPR Feed (Wireframe Spec: w-80 h-full bg-white border-l border-slate-400) */}
      <aside className="w-80 h-full bg-white border-l border-slate-400 flex flex-col select-none">
        <div className="h-10 bg-slate-200 border-b border-slate-300 flex items-center justify-between px-3 font-bold text-xs text-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-600 inline-block animate-pulse"></span>
            <span className="tracking-wider uppercase">LIVE DETECTIONS</span>
          </div>
          <span className="font-mono text-slate-600 text-[11px] bg-white px-1.5 py-0.2 border border-slate-300">
            {liveHits.length} HITS
          </span>
        </div>

        {/* Scrollable Live Detections Feed */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {liveHits.length === 0 ? (
            <div className="p-4 text-center text-slate-400 font-mono text-xs">
              WAITING FOR INCOMING ANPR DETECTION EVENTS...
            </div>
          ) : (
            liveHits.map((hit, idx) => (
              <LiveHitCard
                key={hit.id || idx}
                hit={hit}
                isSelected={selectedHit?.global_id === hit.global_id}
                onSelect={(h) => {
                  onSelectHit && onSelectHit(h);
                }}
              />
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
