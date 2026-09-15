import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import LiveHitCard from '../components/LiveHitCard';
import { Layers, Crosshair, MapPin, ZoomIn, ZoomOut, ShieldAlert, Gauge, Filter } from 'lucide-react';
import { api } from '../services/api';

const BASEMAP_TILES = {
  'google-sat': {
    name: 'Google Maps Satellite',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps'
  },
  'google-street': {
    name: 'Google Maps Streets',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps'
  },
  'carto-dark': {
    name: 'CartoDB Dark (Cyber)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap'
  },
  'osm': {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  }
};

export default function DashboardView({ cameras = [], liveHits = [], onSelectHit, selectedHit }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const cameraLayerRef = useRef(null);
  const vehicleLayerRef = useRef(null);
  const trajectoryLayerRef = useRef(null);
  const areaLayerRef = useRef(null);

  const [activeBasemap, setActiveBasemap] = useState('google-street');
  const [areas, setAreas] = useState([]);
  const [selectedTrajectory, setSelectedTrajectory] = useState(null);
  const [activeVehicles, setActiveVehicles] = useState([]);
  const [feedFilter, setFeedFilter] = useState('all'); // 'all', 'blacklisted', 'speeding'
  const [selectedAreaFocus, setSelectedAreaFocus] = useState('');

  // Load physical areas list
  useEffect(() => {
    const loadAreas = async () => {
      try {
        const areaData = await api.getAreas();
        setAreas(areaData || []);
      } catch (err) {
        console.error('Error fetching areas:', err);
      }
    };
    loadAreas();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Center around Delhi NCR region
    const map = L.map(mapRef.current, {
      center: [28.5800, 77.1600],
      zoom: 12,
      zoomControl: false,
    });

    const initialTile = BASEMAP_TILES[activeBasemap];
    tileLayerRef.current = L.tileLayer(initialTile.url, {
      attribution: initialTile.attribution,
      maxZoom: 19,
    }).addTo(map);

    areaLayerRef.current = L.layerGroup().addTo(map);
    cameraLayerRef.current = L.layerGroup().addTo(map);
    vehicleLayerRef.current = L.layerGroup().addTo(map);
    trajectoryLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch basemap layer dynamically
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const tileConfig = BASEMAP_TILES[activeBasemap] || BASEMAP_TILES['google-street'];
    tileLayerRef.current = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);
  }, [activeBasemap]);

  // Render Specified Area Polygons on Map
  useEffect(() => {
    if (!areaLayerRef.current || areas.length === 0) return;
    areaLayerRef.current.clearLayers();

    areas.forEach((area) => {
      if (area.polygon && area.polygon.length > 0) {
        const poly = L.polygon(area.polygon, {
          color: area.color || '#3b82f6',
          fillColor: area.color || '#3b82f6',
          fillOpacity: 0.15,
          weight: 2,
          dashArray: '4, 4'
        }).bindPopup(`
          <div class="font-mono text-xs">
            <div class="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-1">
              📍 SPECIFIED AREA: ${area.name.toUpperCase()}
            </div>
            <div>SPEED LIMIT: <span class="font-bold text-red-600">${area.speed_limit} KM/H</span></div>
            <div>STATUS: <span class="text-emerald-700 font-bold">MONITORED ZONE</span></div>
          </div>
        `);
        areaLayerRef.current.addLayer(poly);
      }
    });
  }, [areas]);

  // Update Camera Markers
  useEffect(() => {
    if (!cameraLayerRef.current) return;
    cameraLayerRef.current.clearLayers();

    cameras.forEach((cam) => {
      const camIcon = L.divIcon({
        className: 'camera-marker-icon',
        html: `<div class="bg-slate-900 text-white font-mono text-[10px] px-1 font-bold border border-white shadow-md">${cam.id.replace('CAM-DEL-', 'C')}</div>`,
        iconSize: [28, 20],
        iconAnchor: [14, 10],
      });

      const marker = L.marker([cam.lat, cam.lon], { icon: camIcon })
        .bindPopup(`
          <div class="font-mono text-xs">
            <div class="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-1">
              [${cam.id}] ${cam.name}
            </div>
            <div>AREA: <span class="font-bold text-cyan-700">${cam.area || 'Delhi NCR'}</span></div>
            <div>SPEED LIMIT: <span class="font-bold text-red-600">${cam.speed_limit || 60} KM/H</span></div>
            <div>STATUS: <span class="font-bold text-emerald-700 uppercase">${cam.status}</span></div>
            <div>TOTAL HITS: ${cam.total_hits}</div>
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

  // Update Active Vehicle Markers on map
  useEffect(() => {
    if (!vehicleLayerRef.current) return;
    vehicleLayerRef.current.clearLayers();

    activeVehicles.forEach((v) => {
      const vIcon = L.divIcon({
        className: 'vehicle-marker-icon',
        html: `<div class="bg-yellow-300 text-black font-mono font-bold text-[9px] px-1 border border-black shadow-md">${v.plate.substring(0, 5)}</div>`,
        iconSize: [36, 18],
        iconAnchor: [18, 9],
      });

      const marker = L.marker([v.lat, v.lon], { icon: vIcon })
        .bindPopup(`
          <div class="font-mono text-xs">
            <div class="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-1">
              ${v.plate} (${v.vehicle_color} ${v.vehicle_type})
            </div>
            <div>GLOBAL ID: <span class="font-bold">${v.global_id}</span></div>
            <div>AREA: <span class="font-bold text-cyan-800">${v.area_name || 'Delhi NCR'}</span></div>
            <div>LAST SEEN: ${v.last_camera_id} (${v.seconds_ago}s ago)</div>
          </div>
        `);

      vehicleLayerRef.current.addLayer(marker);
    });
  }, [activeVehicles]);

  // Plot Trajectory on map when selected
  useEffect(() => {
    if (!selectedHit || !trajectoryLayerRef.current) return;

    const loadTrajectory = async () => {
      try {
        const data = await api.getTrajectory(selectedHit.global_id);
        setSelectedTrajectory(data);

        trajectoryLayerRef.current.clearLayers();
        if (data.waypoints && data.waypoints.length > 1) {
          const latlngs = data.waypoints.map((wp) => [wp.lat, wp.lon]);

          const polyline = L.polyline(latlngs, {
            color: '#ef4444',
            weight: 4,
            dashArray: '8, 8',
          }).addTo(trajectoryLayerRef.current);

          mapInstanceRef.current?.fitBounds(polyline.getBounds(), { padding: [50, 50] });
        }
      } catch (err) {
        console.error('Error plotting trajectory:', err);
      }
    };

    loadTrajectory();
  }, [selectedHit]);

  const handleAreaFocus = (areaName) => {
    setSelectedAreaFocus(areaName);
    const targetArea = areas.find((a) => a.name === areaName);
    if (targetArea && mapInstanceRef.current) {
      mapInstanceRef.current.setView(targetArea.center, 14);
    }
  };

  const handleResetView = () => {
    setSelectedAreaFocus('');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([28.5800, 77.1600], 12);
    }
  };

  // Filter Live Hits based on feedFilter tab
  const filteredLiveHits = liveHits.filter((hit) => {
    if (feedFilter === 'blacklisted') return hit.is_blacklisted === 1 || hit.is_blacklisted === true;
    if (feedFilter === 'speeding') return hit.is_speeding === 1 || hit.is_speeding === true || (hit.speed_kmh && hit.speed_limit && hit.speed_kmh > hit.speed_limit);
    return true;
  });

  return (
    <div className="flex h-full w-full overflow-hidden select-none">
      {/* Left GIS Map Pane */}
      <div className="flex-1 relative h-full bg-slate-200">
        <div ref={mapRef} className="h-full w-full z-0" />

        {/* Map Header Floating Bar */}
        <div className="absolute top-3 left-3 z-10 bg-white/95 border border-slate-400 p-2 shadow-hard flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 font-bold">
            <MapPin className="w-4 h-4 text-cyan-600" />
            <span>DELHI NCR GRID</span>
          </div>

          {/* Specified Area Focus Selector */}
          <div className="border-l border-slate-300 pl-2">
            <select
              value={selectedAreaFocus}
              onChange={(e) => handleAreaFocus(e.target.value)}
              className="bg-slate-100 border border-slate-400 text-xs font-mono font-bold p-1 text-slate-800 focus:outline-none"
            >
              <option value="">Focus Specified Area...</option>
              {areas.map((a) => (
                <option key={a.name} value={a.name}>
                  📍 {a.name} ({a.speed_limit} km/h)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-300 pl-3">
            <span className="w-2.5 h-2.5 bg-slate-900 inline-block"></span>
            <span className="font-bold">{cameras.length} CAMERAS</span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-300 pl-3">
            <span className="w-2.5 h-2.5 bg-red-600 inline-block animate-pulse"></span>
            <span className="font-bold">{activeVehicles.length} ACTIVE TRACKS</span>
          </div>

          {selectedTrajectory && (
            <div className="border-l border-slate-300 pl-3 flex items-center gap-2">
              <span className="bg-yellow-200 px-1 font-bold border border-yellow-400 text-black">
                {selectedTrajectory.primary_plate}
              </span>
              <span className="text-slate-500 font-bold">
                ({selectedTrajectory.total_hops} waypoints)
              </span>
            </div>
          )}
        </div>

        {/* Top Right Basemap & Controls */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 shadow-hard">
          {/* Tile Layer Switcher */}
          <div className="bg-white border border-slate-400 p-1 flex flex-col gap-1 text-[10px] font-mono font-bold">
            <div className="text-slate-500 px-1 border-b border-slate-200 pb-0.5 uppercase flex items-center gap-1">
              <Layers className="w-3 h-3 text-slate-700" />
              <span>Map Layer</span>
            </div>
            {Object.keys(BASEMAP_TILES).map((key) => (
              <button
                key={key}
                onClick={() => setActiveBasemap(key)}
                className={`px-2 py-1 text-left border ${
                  activeBasemap === key
                    ? 'bg-slate-900 text-white border-black font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                {BASEMAP_TILES[key].name}
              </button>
            ))}
          </div>

          {/* Zoom & Reset Controls */}
          <div className="bg-white border border-slate-400 p-1 flex justify-between">
            <button
              onClick={() => mapInstanceRef.current?.zoomIn()}
              className="bg-white hover:bg-slate-100 p-1.5 border border-slate-300 font-bold"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-slate-800" />
            </button>
            <button
              onClick={() => mapInstanceRef.current?.zoomOut()}
              className="bg-white hover:bg-slate-100 p-1.5 border border-slate-300 font-bold"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-slate-800" />
            </button>
            <button
              onClick={handleResetView}
              className="bg-white hover:bg-slate-100 p-1.5 border border-slate-300 font-bold"
              title="Reset View"
            >
              <Crosshair className="w-4 h-4 text-slate-800" />
            </button>
          </div>
        </div>

        {/* Bottom Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 border border-slate-400 px-3 py-1.5 shadow-hard text-[10px] font-mono text-slate-700 flex gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-slate-900 inline-block border border-white"></span>
            <span className="font-bold">CCTV Camera Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-yellow-400 inline-block border border-black"></span>
            <span className="font-bold">Tracked Vehicle</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-red-600 inline-block border-t-2 border-dashed border-red-600"></span>
            <span className="font-bold">Trajectory Polyline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-blue-500/30 border border-blue-600 inline-block"></span>
            <span className="font-bold">Specified Area Zone</span>
          </div>
        </div>
      </div>

      {/* Right Pane: Live ANPR Feed */}
      <aside className="w-84 h-full bg-white border-l border-slate-400 flex flex-col select-none">
        {/* Feed Header */}
        <div className="h-10 bg-slate-200 border-b border-slate-300 flex items-center justify-between px-3 font-bold text-xs text-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-600 inline-block animate-pulse"></span>
            <span className="tracking-wider uppercase">SCANNED PLATES FEED</span>
          </div>
          <span className="font-mono text-slate-700 text-[11px] bg-white px-1.5 py-0.5 border border-slate-300">
            {filteredLiveHits.length} HITS
          </span>
        </div>

        {/* Feed Filter Tabs */}
        <div className="grid grid-cols-3 gap-px bg-slate-300 border-b border-slate-300 text-[10px] font-mono font-bold">
          <button
            onClick={() => setFeedFilter('all')}
            className={`py-1.5 text-center ${
              feedFilter === 'all'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            ALL HITS
          </button>
          <button
            onClick={() => setFeedFilter('blacklisted')}
            className={`py-1.5 text-center flex items-center justify-center gap-1 ${
              feedFilter === 'blacklisted'
                ? 'bg-red-600 text-white font-bold'
                : 'bg-red-50 hover:bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            HOTLIST
          </button>
          <button
            onClick={() => setFeedFilter('speeding')}
            className={`py-1.5 text-center flex items-center justify-center gap-1 ${
              feedFilter === 'speeding'
                ? 'bg-amber-500 text-white font-bold'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
            }`}
          >
            <Gauge className="w-3 h-3" />
            SPEEDING
          </button>
        </div>

        {/* Scrollable Live Detections Feed */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredLiveHits.length === 0 ? (
            <div className="p-6 text-center text-slate-400 font-mono text-xs italic">
              NO ANPR DETECTION EVENTS FOR FILTER "{feedFilter.toUpperCase()}"
            </div>
          ) : (
            filteredLiveHits.map((hit, idx) => (
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

