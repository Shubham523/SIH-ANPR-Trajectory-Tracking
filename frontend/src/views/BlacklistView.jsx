import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Trash2, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function BlacklistView({ onPlotOnMap }) {
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newThreat, setNewThreat] = useState('HIGH');
  const [filterQuery, setFilterQuery] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    loadBlacklist();
  }, []);

  const loadBlacklist = async () => {
    setLoading(true);
    try {
      const data = await api.getBlacklist();
      setBlacklist(data);
    } catch (err) {
      console.error('Error loading blacklist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlate = async (e) => {
    e.preventDefault();
    if (!newPlate.trim() || !newReason.trim()) return;
    try {
      await api.addToBlacklist({
        plate_text: newPlate.toUpperCase().trim(),
        reason: newReason.trim(),
        threat_level: newThreat
      });
      setNewPlate('');
      setNewReason('');
      setStatusMsg({ type: 'success', text: `Plate ${newPlate.toUpperCase()} added to hotlist.` });
      setTimeout(() => setStatusMsg(null), 3000);
      loadBlacklist();
    } catch (err) {
      console.error('Error adding to blacklist:', err);
      setStatusMsg({ type: 'error', text: 'Failed to add plate to hotlist.' });
    }
  };

  const handleRemovePlate = async (plateText) => {
    try {
      await api.removeFromBlacklist(plateText);
      setStatusMsg({ type: 'success', text: `Plate ${plateText} removed from hotlist.` });
      setTimeout(() => setStatusMsg(null), 3000);
      loadBlacklist();
    } catch (err) {
      console.error('Error removing from blacklist:', err);
      setStatusMsg({ type: 'error', text: 'Failed to remove plate.' });
    }
  };

  const filteredBlacklist = blacklist.filter((item) =>
    item.plate_text.toLowerCase().includes(filterQuery.toLowerCase()) ||
    item.reason.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full p-4 overflow-hidden select-none bg-slate-100">
      {/* Top Header */}
      <div className="bg-white border border-slate-400 p-3 mb-4 flex justify-between items-center shadow-hard-sm">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 text-white p-2">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-slate-900 uppercase tracking-tight">
              Hotlist / Blacklisted Vehicle Registry
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              AUTOMATED ANPR MATCHING & REAL-TIME LAW ENFORCEMENT ALERTS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-red-700 bg-red-50 px-3 py-1.5 border border-red-300 font-bold">
          <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
          <span>{blacklist.length} SUSPECT VEHICLES REGISTERED</span>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-2 mb-3 text-xs font-mono border font-bold flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
              : 'bg-red-100 border-red-400 text-red-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Grid: Left Add Form, Right List Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 overflow-hidden">
        {/* Left Form */}
        <div className="bg-white border border-slate-400 p-4 flex flex-col justify-between shadow-hard-sm">
          <form onSubmit={handleAddPlate} className="space-y-3">
            <div className="font-bold text-xs uppercase text-slate-900 border-b border-slate-300 pb-2 flex items-center gap-2">
              <Plus className="w-4 h-4 text-red-600" />
              <span>Register Blacklisted Vehicle</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                License Plate Number *
              </label>
              <input
                type="text"
                placeholder="e.g. DL-01-AB-1234"
                value={newPlate}
                onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                required
                className="w-full border border-slate-400 p-2 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Threat Level *
              </label>
              <select
                value={newThreat}
                onChange={(e) => setNewThreat(e.target.value)}
                className="w-full border border-slate-400 p-2 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="CRITICAL">CRITICAL (ARMED / TERROR THREAT)</option>
                <option value="HIGH">HIGH (STOLEN / WANTED FIR)</option>
                <option value="WARNING">WARNING (REPEATED SPEED VIOLATOR)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Reason / FIR Reference *
              </label>
              <textarea
                placeholder="e.g. Stolen SUV - FIR #402 / Suspect wanted in robbery"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                rows={3}
                required
                className="w-full border border-slate-400 p-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 border border-red-900 text-xs flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <ShieldAlert className="w-4 h-4" />
              Add To Hotlist Database
            </button>
          </form>

          <div className="bg-slate-100 p-3 border border-slate-300 text-[11px] font-mono text-slate-600 space-y-1">
            <div className="font-bold text-slate-900">HOTLIST ALERT PROTOCOL:</div>
            <div>• Instant WebSocket broadcast upon camera hit</div>
            <div>• Red banner alert on Operator Console</div>
            <div>• Automatic trajectory mapping across city nodes</div>
          </div>
        </div>

        {/* Right Table */}
        <div className="lg:col-span-2 bg-white border border-slate-400 flex flex-col overflow-hidden shadow-hard-sm">
          {/* Table Header & Search Filter */}
          <div className="p-3 bg-slate-200 border-b border-slate-400 flex justify-between items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Filter blacklisted plates or FIR reasons..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full border border-slate-400 pl-8 pr-3 py-1 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            </div>

            <button
              onClick={loadBlacklist}
              className="bg-white hover:bg-slate-100 text-slate-800 px-3 py-1 border border-slate-400 text-xs font-bold font-mono"
            >
              Refresh List
            </button>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase">
                <tr>
                  <th className="p-2 border-r border-slate-300">Plate Number</th>
                  <th className="p-2 border-r border-slate-300">Threat Level</th>
                  <th className="p-2 border-r border-slate-300">Reason / FIR Reference</th>
                  <th className="p-2 border-r border-slate-300">Added Date</th>
                  <th className="p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-slate-400 font-mono">
                      LOADING BLACKLISTED VEHICLES...
                    </td>
                  </tr>
                ) : filteredBlacklist.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-slate-400 font-mono">
                      NO BLACKLISTED VEHICLES FOUND
                    </td>
                  </tr>
                ) : (
                  filteredBlacklist.map((item) => (
                    <tr key={item.plate_text} className="border-b border-slate-200 hover:bg-red-50">
                      <td className="p-2 border-r border-slate-200 font-mono font-bold">
                        <span className="bg-red-600 text-white px-2 py-0.5 border border-red-800 tracking-wider">
                          {item.plate_text}
                        </span>
                      </td>
                      <td className="p-2 border-r border-slate-200 font-mono font-bold">
                        <span
                          className={`px-1.5 py-0.5 border text-[10px] ${
                            item.threat_level === 'CRITICAL'
                              ? 'bg-red-900 text-white border-red-950 animate-pulse'
                              : item.threat_level === 'HIGH'
                              ? 'bg-red-100 text-red-900 border-red-400'
                              : 'bg-amber-100 text-amber-900 border-amber-400'
                          }`}
                        >
                          {item.threat_level || 'HIGH'}
                        </span>
                      </td>
                      <td className="p-2 border-r border-slate-200 font-sans text-slate-800 font-semibold">
                        {item.reason}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-mono text-slate-500">
                        {new Date(item.added_at * 1000).toISOString().substring(0, 10)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleRemovePlate(item.plate_text)}
                          className="bg-white hover:bg-red-100 text-red-600 p-1 border border-slate-300 hover:border-red-400"
                          title="Remove from Hotlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
