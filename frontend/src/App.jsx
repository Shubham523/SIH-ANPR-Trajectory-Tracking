import React, { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import DashboardView from './views/DashboardView';
import CamerasView from './views/CamerasView';
import SearchView from './views/SearchView';
import BlacklistView from './views/BlacklistView';
import SystemView from './views/SystemView';
import { api } from './services/api';
import { liveSocket } from './services/websocket';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [cameras, setCameras] = useState([]);
  const [liveHits, setLiveHits] = useState([]);
  const [selectedHit, setSelectedHit] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [simulatorRunning, setSimulatorRunning] = useState(true);

  // Fetch initial cameras and recent detections
  useEffect(() => {
    const initData = async () => {
      try {
        const camList = await api.getCameras();
        setCameras(camList);

        const recent = await api.getRecentDetections(25);
        const formatted = recent.map((d) => ({
          id: d.id,
          global_id: d.global_id,
          camera_id: d.camera_id,
          camera_name: d.camera_name,
          area_name: d.area_name || 'Delhi NCR',
          lat: d.lat,
          lon: d.lon,
          timestamp: d.timestamp,
          time_str: new Date(d.timestamp * 1000).toISOString().substring(11, 19),
          plate_text: d.plate_text || 'OCCLUDED',
          plate_confidence: d.plate_confidence,
          vehicle_type: d.vehicle_type,
          vehicle_color: d.vehicle_color,
          match_type: d.match_type,
          match_score: d.match_score,
          speed_kmh: (d.speed_from_prev_kmh && d.speed_from_prev_kmh > 0) ? d.speed_from_prev_kmh : (d.speed_kmh || 54.0),
          speed_limit: d.speed_limit || 60.0,
          is_speeding: d.is_speeding || ((d.speed_from_prev_kmh || d.speed_kmh || 54.0) > (d.speed_limit || 60.0)),
          is_blacklisted: d.is_blacklisted,
          blacklist_reason: d.blacklist_reason,
        }));
        setLiveHits(formatted);
      } catch (err) {
        console.error('Initial data fetch error:', err);
      }
    };
    initData();

    // Connect WebSocket
    liveSocket.connect();
    const unsubStatus = liveSocket.onStatusChange(setWsConnected);

    // Subscribe to live detections
    const unsubMsg = liveSocket.subscribe((msg) => {
      if (msg.type === 'LIVE_DETECTION') {
        const parsedSpeed = (msg.data.speed_from_prev_kmh && msg.data.speed_from_prev_kmh > 0) ? msg.data.speed_from_prev_kmh : (msg.data.speed_kmh || 54.0);
        const hitData = {
          ...msg.data,
          time_str: new Date(msg.data.timestamp * 1000).toISOString().substring(11, 19),
          speed_kmh: parsedSpeed,
          is_speeding: msg.data.is_speeding || (parsedSpeed > (msg.data.speed_limit || 60.0))
        };
        setLiveHits((prev) => [hitData, ...prev.slice(0, 99)]);
        
        // Update camera hit counter dynamically
        setCameras((prevCams) =>
          prevCams.map((c) =>
            c.id === msg.data.camera_id ? { ...c, total_hits: (c.total_hits || 0) + 1 } : c
          )
        );
      }
    });

    return () => {
      unsubStatus();
      unsubMsg();
    };
  }, []);

  const handleToggleSimulator = async () => {
    try {
      const nextState = !simulatorRunning;
      await api.toggleSimulator(nextState);
      setSimulatorRunning(nextState);
    } catch (err) {
      console.error('Simulator toggle error:', err);
    }
  };

  const handleAddCamera = async (newCam) => {
    try {
      const saved = await api.addCamera(newCam);
      setCameras((prev) => [...prev, saved]);
    } catch (err) {
      console.error('Add camera error:', err);
    }
  };

  const handlePlotOnMap = (vehicle) => {
    setSelectedHit({
      global_id: vehicle.global_id,
      plate_text: vehicle.primary_plate,
    });
    setCurrentView('dashboard');
  };

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col overflow-hidden font-sans text-slate-900 select-none">
      {/* Fixed 40px TopBar */}
      <TopBar wsConnected={wsConnected} />

      {/* Main Workspace (Sidebar + Content Area) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Fixed 256px Left Sidebar */}
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          simulatorRunning={simulatorRunning}
          onToggleSimulator={handleToggleSimulator}
          liveHitCount={liveHits.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 relative bg-slate-200 border-l border-slate-400 overflow-hidden">
          {currentView === 'dashboard' && (
            <DashboardView
              cameras={cameras}
              liveHits={liveHits}
              selectedHit={selectedHit}
              onSelectHit={setSelectedHit}
            />
          )}

          {currentView === 'cameras' && (
            <CamerasView
              cameras={cameras}
              liveHits={liveHits}
              onAddCamera={handleAddCamera}
            />
          )}

          {currentView === 'blacklist' && (
            <BlacklistView onPlotOnMap={handlePlotOnMap} />
          )}

          {currentView === 'search' && (
            <SearchView onPlotOnMap={handlePlotOnMap} />
          )}

          {currentView === 'system' && (
            <SystemView liveHits={liveHits} />
          )}
        </main>
      </div>
    </div>
  );
}

