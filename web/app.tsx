const { useState, useEffect, useCallback } = React;
const MapView = (window as any).MapView;
const Map3DView = (window as any).Map3DView;
const DashboardComponent = (window as any).Dashboard;

/* ── Helpers ── */
const SEV_COLORS: Record<number, string> = { 5:'#ef4444', 4:'#f97316', 3:'#f59e0b', 2:'#3b82f6', 1:'#10b981' };
const SEV_LABELS: Record<number, string> = { 5:'CRITICAL', 4:'SEVERE', 3:'HIGH', 2:'MODERATE', 1:'LOW' };
const STATUS_COLORS: Record<string,string> = {
  NEW:'#3b82f6', UNDER_REVIEW:'#8b5cf6', VERIFIED:'#10b981', REJECTED:'#ef4444',
  DUPLICATE:'#6b7280', CANCELLED:'#6b7280', PRIORITIZED:'#f59e0b', ALLOCATED:'#06b6d4',
  DISPATCHED:'#f97316', IN_PROGRESS:'#eab308', RESOLVED:'#22c55e',
  AVAILABLE:'#10b981', RESERVED:'#f59e0b', BUSY:'#ef4444', MAINTENANCE:'#6b7280', OFFLINE:'#374151',
  PENDING:'#f59e0b', APPROVED:'#10b981',
};
const api = async (url: string, opts?: any) => {
  const r = await fetch(url, { headers: {'Content-Type':'application/json'}, ...opts });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
};
const timeAgo = (ts: string) => {
  if (!ts) return '';
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60) return 'just now'; if (d < 3600) return `${Math.floor(d/60)}m ago`;
  if (d < 86400) return `${Math.floor(d/3600)}h ago`; return new Date(ts).toLocaleDateString();
};

/* ── Toast ── */
const Toast = ({ msg, type, onClose }: any) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  const bg = type === 'error' ? 'bg-red-900/90 border-red-700' : type === 'success' ? 'bg-emerald-900/90 border-emerald-700' : 'bg-blue-900/90 border-blue-700';
  return <div className={`toast ${bg} border rounded-lg px-4 py-3 text-sm text-white shadow-2xl max-w-sm`}>{msg}</div>;
};

/* ── Badge ── */
const Badge = ({ text, color }: any) => (
  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>{text}</span>
);

/* ── Create Incident Modal ── */
const CreateModal = ({ onClose, onCreated }: any) => {
  const [form, setForm] = useState({ title:'', description:'', type:'FIRE', severity:3, latitude:37.78, longitude:-122.42, population_impact:0.5, vulnerability_score:0.5, accessibility_risk:0.5 });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(p => ({...p, [k]: v}));
  const submit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try { await api('/api/incidents', { method:'POST', body: JSON.stringify(form) }); onCreated(); onClose(); } catch(e) { alert('Error creating incident'); }
    setSaving(false);
  };
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);

  const types = ['FIRE','FLOOD','EARTHQUAKE_DAMAGE','MEDICAL_EMERGENCY','STRUCTURAL_COLLAPSE','HAZMAT_SPILL','TRAPPED_PERSONS','UTILITY_FAILURE','EVACUATION'];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass-panel-solid rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold">Report New Incident</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700">✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-medium">Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white" placeholder="Describe the incident..." />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-medium">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white h-20 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-medium">Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                {types.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-medium">Severity: {form.severity} — {SEV_LABELS[form.severity]}</label>
              <input type="range" min={1} max={5} value={form.severity} onChange={e => set('severity', +e.target.value)} className="w-full accent-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-gray-400 mb-1">Latitude</label><input type="number" step="0.001" value={form.latitude} onChange={e => set('latitude', +e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Longitude</label><input type="number" step="0.001" value={form.longitude} onChange={e => set('longitude', +e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs text-gray-400 mb-1">Population Impact</label><input type="range" min={0} max={1} step={0.1} value={form.population_impact} onChange={e => set('population_impact', +e.target.value)} className="w-full accent-blue-500" /><span className="text-xs font-mono text-gray-500">{form.population_impact}</span></div>
            <div><label className="block text-xs text-gray-400 mb-1">Vulnerability</label><input type="range" min={0} max={1} step={0.1} value={form.vulnerability_score} onChange={e => set('vulnerability_score', +e.target.value)} className="w-full accent-blue-500" /><span className="text-xs font-mono text-gray-500">{form.vulnerability_score}</span></div>
            <div><label className="block text-xs text-gray-400 mb-1">Access Risk</label><input type="range" min={0} max={1} step={0.1} value={form.accessibility_risk} onChange={e => set('accessibility_risk', +e.target.value)} className="w-full accent-blue-500" /><span className="text-xs font-mono text-gray-500">{form.accessibility_risk}</span></div>
          </div>
          <button onClick={submit} disabled={saving || !form.title.trim()} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-all">
            {saving ? 'Creating...' : '⚡ Create Incident'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main App ── */
const App = () => {
  const [view, setView] = useState('dashboard');
  const [incidents, setIncidents] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [roads, setRoads] = useState<any[]>([]);
  const [hazards, setHazards] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);
  const [eoLayers, setEoLayers] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [selIncident, setSelIncident] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<any>(null);
  const [time, setTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const notify = (msg: string, type='info') => setToast({ msg, type, key: Date.now() });

  const fetchAll = useCallback(async () => {
    try {
      const [inc, res, alloc, rd, hz, eo, audit] = await Promise.all([
        api('/api/incidents').catch(() => ({ incidents:[] })),
        api('/api/resources').catch(() => ({ resources:[] })),
        api('/api/allocations').catch(() => ({ allocations:[] })),
        api('/api/roads').catch(() => ({ roads:[], hospitals:[], shelters:[] })),
        api('/api/hazards').catch(() => ({ hazards:[] })),
        api('/api/eo').catch(() => ({ layers:[] })),
        api('/api/audit').catch(() => ({ entries:[] })),
      ]);
      setIncidents(inc.incidents || []);
      setResources(res.resources || []);
      setAllocations(alloc.allocations || []);
      setRoads(rd.roads || []);
      setHospitals(rd.hospitals || []);
      setShelters(rd.shelters || []);
      setHazards(hz.hazards || []);
      setEoLayers(eo.layers || []);
      setAuditLog(audit.entries || []);
      // Fetch recommendations separately
      try {
        const recs = await api('/api/allocations');
        // Recommendations aren't a separate endpoint, they're stored in memory
      } catch(e) {}
    } catch(e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); const iv = setInterval(fetchAll, 12000); return () => clearInterval(iv); }, [fetchAll]);
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSelIncident(null); setShowCreate(false); } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);

  /* ── Actions ── */
  const handleOptimize = async () => {
    notify('Running optimizer...', 'info');
    try {
      const data = await api('/api/optimize', { method:'POST', body:'{}' });
      setRecommendations(data.recommendations || []);
      notify(`Generated ${data.recommendations?.length || 0} recommendations`, 'success');
      fetchAll();
    } catch(e) { notify('Optimization failed', 'error'); }
  };
  const handleReallocate = async () => {
    notify('Reallocating resources...', 'info');
    try {
      const data = await api('/api/reallocate', { method:'POST', body:'{}' });
      setRecommendations(data.recommendations || []);
      notify(`Reallocation complete: ${data.recommendations?.length || 0} new recommendations`, 'success');
      fetchAll();
    } catch(e) { notify('Reallocation failed', 'error'); }
  };
  const handleVerify = async (id: string, status: string) => {
    try {
      await api(`/api/incidents/${id}/verify`, { method:'POST', body: JSON.stringify({ status, notes:`Operator ${status.toLowerCase()} this incident`, verified_by:'operator' }) });
      notify(`Incident ${status.toLowerCase()}`, 'success'); fetchAll();
    } catch(e) { notify('Verification failed', 'error'); }
  };
  const handleApprove = async (recId: string) => {
    try {
      await api(`/api/recommendations/${recId}/approve`, { method:'POST', body: JSON.stringify({ approved_by:'operator' }) });
      notify('Recommendation approved — allocation created', 'success'); fetchAll();
    } catch(e) { notify('Approval failed', 'error'); }
  };
  const handleReject = async (recId: string) => {
    try {
      await api(`/api/recommendations/${recId}/reject`, { method:'POST', body: JSON.stringify({ reason:'Operator rejected', rejected_by:'operator' }) });
      notify('Recommendation rejected', 'info'); fetchAll();
    } catch(e) { notify('Rejection failed', 'error'); }
  };

  const selectedInc = incidents.find(i => i.id === selIncident);
  const incRecs = recommendations.filter(r => r.incident_id === selIncident && r.status === 'PENDING');
  const incAllocs = allocations.filter(a => a.incident_id === selIncident);
  const incAudit = auditLog.filter(a => a.entity_id === selIncident);
  const pendingCount = recommendations.filter(r => r.status === 'PENDING').length;

  const mapProps = { incidents, resources, allocations, roads, hazards, hospitals, shelters, eoLayers, onSelectIncident: (id: string) => setSelIncident(id), onSelectResource: () => {} };
  const sortedIncidents = [...incidents].sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));

  /* ── Nav items ── */
  const navItems = [
    { id:'dashboard', icon:'📊', label:'Dashboard' },
    { id:'map', icon:'🗺️', label:'Map View' },
    { id:'3d', icon:'🏗️', label:'3D View' },
    { id:'incidents', icon:'📋', label:'Incidents' },
    { id:'resources', icon:'🚛', label:'Resources' },
    { id:'audit', icon:'📜', label:'Audit Log' },
  ];

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-cmd-bg text-gray-100 font-sans">
      {/* ── TOP BAR ── */}
      <header className="h-14 flex-shrink-0 border-b border-cmd-border bg-cmd-panel/90 backdrop-blur flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebar(!sidebar)} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <span className="font-bold tracking-widest text-sm text-gradient">DISASTER RESPONSE COMMAND CENTER</span>
        </div>
        <div className="flex items-center gap-5 text-xs">
          <div className="flex items-center gap-2"><span className="status-dot dot-online"></span><span className="text-gray-400">System Online</span></div>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400">🔥 <strong className="text-white">{incidents.filter(i => !['RESOLVED','CANCELLED','REJECTED'].includes(i.status)).length}</strong> active</span>
          <span className="text-gray-400">🚛 <strong className="text-white">{resources.filter(r => r.status === 'AVAILABLE').length}</strong> avail</span>
          {pendingCount > 0 && (
            <span className="bg-amber-500/20 border border-amber-500/40 text-amber-400 px-2.5 py-0.5 rounded-full font-semibold pulse-critical">
              ⚠️ {pendingCount} pending
            </span>
          )}
          <span className="text-gray-500">|</span>
          <span className="font-mono text-gray-400">{time.toLocaleTimeString()}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── SIDEBAR ── */}
        <aside className={`${sidebar ? 'w-52' : 'w-14'} flex-shrink-0 border-r border-cmd-border bg-cmd-panel flex flex-col py-3 px-2 transition-all duration-300 z-20`}>
          <nav className="space-y-1 flex-1">
            {navItems.map(n => (
              <button key={n.id} onClick={() => setView(n.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${view === n.id ? 'bg-cmd-accent/20 text-blue-400 font-semibold border border-blue-500/20' : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'}`}>
                <span className="text-base flex-shrink-0">{n.icon}</span>
                {sidebar && <span className="truncate">{n.label}</span>}
              </button>
            ))}
          </nav>
          <div className="border-t border-cmd-border pt-3 mt-2 space-y-2">
            <button onClick={() => setShowCreate(true)} className={`w-full bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${sidebar ? 'py-2 px-3 text-sm' : 'py-2 text-base'}`}>
              <span>+</span>{sidebar && <span>New Incident</span>}
            </button>
            <button onClick={handleOptimize} className={`w-full bg-emerald-600/80 hover:bg-emerald-500 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${sidebar ? 'py-2 px-3 text-xs' : 'py-2 text-sm'}`}>
              <span>⚡</span>{sidebar && <span>Optimize</span>}
            </button>
            <button onClick={handleReallocate} className={`w-full bg-purple-600/80 hover:bg-purple-500 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${sidebar ? 'py-2 px-3 text-xs' : 'py-2 text-sm'}`}>
              <span>🔄</span>{sidebar && <span>Reallocate</span>}
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 relative overflow-hidden bg-cmd-bg">
          {loading ? (
            <div className="flex items-center justify-center h-full"><div className="text-gray-500 text-lg">Loading platform data...</div></div>
          ) : (
            <>
              {view === 'dashboard' && <DashboardComponent />}
              {view === 'map' && <MapView {...mapProps} />}
              {view === '3d' && <Map3DView {...mapProps} />}

              {/* ── INCIDENTS VIEW ── */}
              {view === 'incidents' && (
                <div className="p-5 h-full overflow-y-auto fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Incidents ({incidents.length})</h2>
                    <div className="flex gap-2">
                      <button onClick={handleOptimize} className="bg-emerald-600/80 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-all">⚡ Run Optimizer</button>
                      <button onClick={handleReallocate} className="bg-purple-600/80 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-all">🔄 Reallocate</button>
                    </div>
                  </div>
                  <div className="glass-panel rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-900/50 border-b border-cmd-border">
                        <tr>
                          <th className="px-4 py-3 text-xs text-gray-400 font-semibold">Status</th>
                          <th className="px-4 py-3 text-xs text-gray-400 font-semibold">Title</th>
                          <th className="px-4 py-3 text-xs text-gray-400 font-semibold">Type</th>
                          <th className="px-4 py-3 text-xs text-gray-400 font-semibold">Severity</th>
                          <th className="px-4 py-3 text-xs text-gray-400 font-semibold">Priority</th>
                          <th className="px-4 py-3 text-xs text-gray-400 font-semibold">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedIncidents.map(inc => (
                          <tr key={inc.id} onClick={() => setSelIncident(inc.id)}
                            className={`border-b border-gray-800/50 cursor-pointer transition-colors ${selIncident === inc.id ? 'bg-blue-900/20' : 'hover:bg-gray-800/40'}`}>
                            <td className="px-4 py-3"><Badge text={inc.status} color={STATUS_COLORS[inc.status] || '#6b7280'} /></td>
                            <td className="px-4 py-3 font-medium text-gray-200 max-w-[200px] truncate">{inc.title}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{(inc.type || '').replace(/_/g, ' ')}</td>
                            <td className="px-4 py-3"><span className={`severity-badge sev-${inc.severity}`}>{SEV_LABELS[inc.severity] || inc.severity}</span></td>
                            <td className="px-4 py-3 font-mono text-gray-300">{(inc.priority_score || 0).toFixed(3)}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{timeAgo(inc.reported_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {incidents.length === 0 && <div className="text-center py-12 text-gray-500">No incidents reported</div>}
                  </div>
                </div>
              )}

              {/* ── RESOURCES VIEW ── */}
              {view === 'resources' && (
                <div className="p-5 h-full overflow-y-auto fade-in">
                  <h2 className="text-xl font-bold mb-4">Resources ({resources.length})</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {resources.map(r => (
                      <div key={r.id} className="glass-panel rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer hover:border-gray-600" onClick={() => setSelIncident(null)}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm text-gray-200">{r.name}</span>
                          <Badge text={r.status} color={STATUS_COLORS[r.status] || '#6b7280'} />
                        </div>
                        <div className="text-xs text-gray-400 space-y-1">
                          <div>Type: <span className="text-gray-300">{(r.type || '').replace(/_/g, ' ')}</span></div>
                          <div>Speed: <span className="font-mono text-gray-300">{r.speed_kmh} km/h</span></div>
                          <div>Capabilities: {(r.capability_tags || []).map((t: string) => <span key={t} className="inline-block bg-gray-800 rounded px-1.5 py-0.5 text-[10px] mr-1">{t}</span>)}</div>
                          {r.current_assignment && <div className="text-amber-400 text-[10px] mt-1">Assigned: {r.current_assignment.slice(0,8)}...</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── AUDIT LOG VIEW ── */}
              {view === 'audit' && (
                <div className="p-5 h-full overflow-y-auto fade-in">
                  <h2 className="text-xl font-bold mb-4">Audit Log ({auditLog.length})</h2>
                  <div className="glass-panel rounded-xl divide-y divide-gray-800/50">
                    {auditLog.map((a, i) => (
                      <div key={a.id || i} className="px-5 py-3 flex items-start gap-4 hover:bg-gray-800/30 transition">
                        <span className="text-lg flex-shrink-0 mt-0.5">{a.action === 'CREATE' ? '➕' : a.action === 'APPROVE' ? '✅' : a.action === 'REJECT' ? '❌' : a.action === 'UPDATE' ? '📝' : '📌'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-200"><strong>{a.action}</strong> — {a.entity_type}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{a.details || 'No details'}</div>
                          {a.previous_state && a.new_state && (
                            <div className="text-xs mt-1"><span className="text-red-400">{a.previous_state}</span> → <span className="text-emerald-400">{a.new_state}</span></div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-mono text-gray-500">{timeAgo(a.timestamp)}</div>
                          <div className="text-[10px] text-gray-600 mt-0.5">by {a.user}</div>
                        </div>
                      </div>
                    ))}
                    {auditLog.length === 0 && <div className="text-center py-12 text-gray-500">No audit entries yet. Interact with incidents to create audit history.</div>}
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* ── DETAIL PANEL ── */}
        {selectedInc && (
          <aside className="w-[380px] flex-shrink-0 border-l border-cmd-border bg-cmd-panel overflow-y-auto slide-in z-20">
            <div className="p-5 space-y-5">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-3">
                  <h3 className="font-bold text-lg leading-tight">{selectedInc.title}</h3>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge text={selectedInc.status} color={STATUS_COLORS[selectedInc.status] || '#6b7280'} />
                    <span className={`severity-badge sev-${selectedInc.severity}`}>{SEV_LABELS[selectedInc.severity]}</span>
                  </div>
                </div>
                <button onClick={() => setSelIncident(null)} className="text-gray-400 hover:text-white bg-gray-800 rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-gray-700 flex-shrink-0">✕</button>
              </div>

              {/* Info */}
              <div className="text-xs space-y-2 text-gray-400">
                <div className="flex justify-between"><span>Type</span><span className="text-gray-200">{(selectedInc.type || '').replace(/_/g,' ')}</span></div>
                <div className="flex justify-between"><span>Location</span><span className="font-mono text-gray-300">{selectedInc.latitude?.toFixed(4)}, {selectedInc.longitude?.toFixed(4)}</span></div>
                <div className="flex justify-between"><span>Reported</span><span className="text-gray-300">{timeAgo(selectedInc.reported_at)}</span></div>
                {selectedInc.description && <div className="pt-1 text-gray-300 border-t border-gray-800 mt-1">{selectedInc.description}</div>}
              </div>

              {/* Priority Breakdown */}
              <div className="glass-panel rounded-lg p-3">
                <h4 className="text-xs font-semibold text-gray-300 mb-2">Priority Score: <span className="text-white font-mono">{(selectedInc.priority_score || 0).toFixed(3)}</span></h4>
                <div className="space-y-1.5 text-xs">
                  {[
                    { label: 'Severity (35%)', val: selectedInc.severity / 5, w: 0.35 },
                    { label: 'Population (25%)', val: selectedInc.population_impact, w: 0.25 },
                    { label: 'Vulnerability (20%)', val: selectedInc.vulnerability_score, w: 0.20 },
                    { label: 'Access Risk (20%)', val: selectedInc.accessibility_risk, w: 0.20 },
                  ].map(p => (
                    <div key={p.label}>
                      <div className="flex justify-between text-gray-400"><span>{p.label}</span><span className="font-mono text-gray-300">{(p.val * p.w).toFixed(3)}</span></div>
                      <div className="w-full h-1.5 bg-gray-800 rounded-full mt-0.5"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.val * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Actions */}
              {['NEW', 'UNDER_REVIEW'].includes(selectedInc.status) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-300">Verification Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleVerify(selectedInc.id, 'VERIFIED')} className="bg-emerald-600/80 hover:bg-emerald-500 text-white py-2 rounded-lg text-xs font-medium transition-all">✓ Verify</button>
                    <button onClick={() => handleVerify(selectedInc.id, 'REJECTED')} className="bg-red-600/80 hover:bg-red-500 text-white py-2 rounded-lg text-xs font-medium transition-all">✕ Reject</button>
                    <button onClick={() => handleVerify(selectedInc.id, 'DUPLICATE')} className="bg-gray-600/80 hover:bg-gray-500 text-white py-2 rounded-lg text-xs font-medium transition-all">⊘ Duplicate</button>
                    <button onClick={() => handleVerify(selectedInc.id, 'CANCELLED')} className="bg-gray-600/80 hover:bg-gray-500 text-white py-2 rounded-lg text-xs font-medium transition-all">⊗ Cancel</button>
                  </div>
                </div>
              )}

              {/* Pending Recommendations */}
              {incRecs.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-300">Pending Recommendations ({incRecs.length})</h4>
                  {incRecs.map(rec => {
                    const res = resources.find(r => r.id === rec.resource_id);
                    return (
                      <div key={rec.id} className="glass-panel rounded-lg p-3 space-y-2 border border-amber-500/20">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-semibold text-gray-200">{res?.name || 'Resource'}</div>
                            <div className="text-xs text-gray-400">{res?.type?.replace(/_/g,' ') || ''}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono text-blue-400">ETA: {rec.eta_minutes?.toFixed(0)}m</div>
                            <div className="text-[10px] text-gray-500">Conf: {(rec.confidence * 100).toFixed(0)}%</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          <div className="mb-1">📍 {rec.road_state_summary}</div>
                          {rec.reasons?.map((r: string, i: number) => <div key={i} className="text-gray-500">• {r}</div>)}
                        </div>
                        {rec.alternatives?.length > 0 && (
                          <div className="text-[10px] text-gray-500 border-t border-gray-800 pt-1">
                            Alternatives: {rec.alternatives.map((a: any) => `${a.resource_name} (${a.eta_minutes?.toFixed(0)}m)`).join(', ')}
                          </div>
                        )}
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => handleApprove(rec.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded-lg text-xs font-semibold transition-all">✅ Approve</button>
                          <button onClick={() => handleReject(rec.id)} className="flex-1 bg-red-600/80 hover:bg-red-500 text-white py-1.5 rounded-lg text-xs font-semibold transition-all">❌ Reject</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Active Allocations */}
              {incAllocs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-300">Active Allocations ({incAllocs.length})</h4>
                  {incAllocs.map(a => {
                    const res = resources.find(r => r.id === a.resource_id);
                    return (
                      <div key={a.id} className="glass-panel rounded-lg p-3 border border-emerald-500/20">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-200">{res?.name || a.resource_id.slice(0,8)}</span>
                          <Badge text={a.status} color={STATUS_COLORS[a.status] || '#10b981'} />
                        </div>
                        <div className="text-xs text-gray-400 mt-1">ETA: {a.eta_minutes?.toFixed(0)} min | Approved by: {a.approved_by || 'N/A'}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Audit for this incident */}
              {incAudit.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-300">History</h4>
                  {incAudit.slice(0, 10).map((a, i) => (
                    <div key={i} className="text-xs flex gap-2">
                      <span className="text-gray-500 font-mono flex-shrink-0">{timeAgo(a.timestamp)}</span>
                      <span className="text-gray-400">{a.action}: {a.details}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ── STATUS BAR ── */}
      <footer className="h-7 flex-shrink-0 border-t border-cmd-border bg-cmd-panel/80 flex items-center px-4 text-[10px] text-gray-500 gap-4 z-20">
        <span className="flex items-center gap-1.5"><span className="status-dot dot-online"></span>Connected</span>
        <span>|</span>
        <span>{incidents.length} incidents</span>
        <span>•</span>
        <span>{resources.length} resources</span>
        <span>•</span>
        <span>{allocations.length} allocations</span>
        <span>•</span>
        <span>{roads.filter(r => r.state === 'BLOCKED').length} roads blocked</span>
        <span className="ml-auto font-mono">v1.0.0 | Modular Monolith</span>
      </footer>

      {/* ── MODALS ── */}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={fetchAll} />}
      {toast && <Toast key={toast.key} msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
