const BASE_URL = typeof window !== 'undefined' && window.location.origin.includes(':5173')
  ? 'http://localhost:8000/api'
  : '/api';

export const api = {
  // Cameras
  async getCameras() {
    const res = await fetch(`${BASE_URL}/cameras`);
    if (!res.ok) throw new Error('Failed to fetch cameras');
    return res.json();
  },

  async addCamera(camera) {
    const res = await fetch(`${BASE_URL}/cameras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(camera),
    });
    if (!res.ok) throw new Error('Failed to add camera');
    return res.json();
  },

  // Detections
  async getRecentDetections(limit = 50) {
    const res = await fetch(`${BASE_URL}/detections/recent?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch detections');
    return res.json();
  },

  // Trajectories
  async searchTrajectories({ plate, cameraId, vehicleType, limit = 50 } = {}) {
    const params = new URLSearchParams();
    if (plate) params.append('plate', plate);
    if (cameraId) params.append('camera_id', cameraId);
    if (vehicleType) params.append('vehicle_type', vehicleType);
    params.append('limit', limit);

    const res = await fetch(`${BASE_URL}/trajectories/search?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to search trajectories');
    return res.json();
  },

  async getTrajectory(globalId) {
    const res = await fetch(`${BASE_URL}/trajectories/${globalId}`);
    if (!res.ok) throw new Error('Failed to fetch trajectory details');
    return res.json();
  },

  async getActiveTrajectories() {
    const res = await fetch(`${BASE_URL}/trajectories/live/active`);
    if (!res.ok) throw new Error('Failed to fetch active trajectories');
    return res.json();
  },

  // System & DevOps
  async getSystemMetrics() {
    const res = await fetch(`${BASE_URL}/system/metrics`);
    if (!res.ok) throw new Error('Failed to fetch system metrics');
    return res.json();
  },

  async toggleSimulator(enable) {
    const res = await fetch(`${BASE_URL}/system/simulator/toggle?enable=${enable}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to toggle simulator');
    return res.json();
  }
};
