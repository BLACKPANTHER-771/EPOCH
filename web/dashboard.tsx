const { useEffect, useState, useRef } = React;

const SEV_COLORS: Record<number, string> = { 5: '#ef4444', 4: '#f97316', 3: '#f59e0b', 2: '#3b82f6', 1: '#10b981' };
const SEV_LABELS: Record<number, string> = { 5: 'Critical', 4: 'Severe', 3: 'High', 2: 'Moderate', 1: 'Low' };

const KpiCard = ({ title, value, icon, color, sub }: any) => (
  <div className={`glass-panel rounded-xl p-5 border-l-4 hover:shadow-xl hover:shadow-${color}-500/5 transition-all duration-300 group`}
       style={{ borderLeftColor: color }}>
    <div className="flex justify-between items-start">
      <p className="text-gray-400 text-sm font-medium">{title}</p>
      <span className="text-2xl opacity-70 group-hover:opacity-100 transition-opacity">{icon}</span>
    </div>
    <p className="text-3xl font-mono font-bold mt-2 text-gray-100">{typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const barRef = useRef<HTMLCanvasElement>(null);
  const donutRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const load = async () => {
      try { const r = await fetch('/api/dashboard'); if (r.ok) setStats(await r.json()); } catch(e) { console.warn('Dashboard fetch failed'); }
    };
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, []);

  // Severity bar chart
  useEffect(() => {
    if (!barRef.current || !stats?.incidents_by_severity) return;
    const canvas = barRef.current;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    ctx.clearRect(0, 0, W, H);
    const data = stats.incidents_by_severity;
    const maxVal = Math.max(...Object.values(data).map(Number), 1);
    const barH = 22, gap = 12, labelW = 70, startY = 10;

    [5,4,3,2,1].forEach((sev, i) => {
      const y = startY + i * (barH + gap);
      const val = data[sev] || data[String(sev)] || 0;
      const barW = ((W - labelW - 50) * val) / maxVal;
      // Label
      ctx.fillStyle = '#9ca3af'; ctx.font = '12px Inter, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(SEV_LABELS[sev], labelW - 8, y + barH / 2 + 4);
      // Bar bg
      ctx.fillStyle = 'rgba(55,65,81,0.3)';
      ctx.beginPath(); ctx.roundRect(labelW, y, W - labelW - 40, barH, 4); ctx.fill();
      // Bar
      if (barW > 0) {
        ctx.fillStyle = SEV_COLORS[sev];
        ctx.beginPath(); ctx.roundRect(labelW, y, Math.max(barW, 8), barH, 4); ctx.fill();
      }
      // Value
      ctx.fillStyle = '#e5e7eb'; ctx.font = 'bold 12px JetBrains Mono, monospace'; ctx.textAlign = 'left';
      ctx.fillText(String(val), labelW + barW + 8, y + barH / 2 + 4);
    });
  }, [stats]);

  // Resource donut chart
  useEffect(() => {
    if (!donutRef.current || !stats) return;
    const canvas = donutRef.current;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, r = Math.min(cx, cy) - 30, inner = r * 0.6;
    const slices = [
      { label: 'Available', value: stats.available_resources || 0, color: '#10b981' },
      { label: 'Deployed', value: stats.deployed_resources || 0, color: '#3b82f6' },
    ];
    const total = slices.reduce((s, d) => s + d.value, 0) || 1;
    let angle = -Math.PI / 2;
    slices.forEach(s => {
      const sweep = (s.value / total) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, angle, angle + sweep); ctx.lineTo(cx, cy);
      ctx.fillStyle = s.color; ctx.fill();
      angle += sweep;
    });
    // Inner circle (donut hole)
    ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(17,24,39,0.95)'; ctx.fill();
    // Center text
    ctx.fillStyle = '#f3f4f6'; ctx.font = 'bold 24px JetBrains Mono, monospace'; ctx.textAlign = 'center';
    ctx.fillText(String(total), cx, cy + 4);
    ctx.fillStyle = '#9ca3af'; ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Total', cx, cy + 20);
    // Legend below
    slices.forEach((s, i) => {
      const lx = cx - 60 + i * 120, ly = cy + r + 16;
      ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(lx - 8, ly - 3, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d1d5db'; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(`${s.label}: ${s.value}`, lx, ly);
    });
  }, [stats]);

  const timeAgo = (ts: string) => {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return 'just now'; if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`; return `${Math.floor(diff/86400)}d ago`;
  };

  if (!stats) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-500 text-lg">Loading dashboard data...</div>
    </div>
  );

  return (
    <div className="p-6 h-full overflow-y-auto space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Operations Overview</h2>
        <span className="text-xs text-gray-500 font-mono">Auto-refresh: 15s</span>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Active Incidents" value={stats.active_incidents} icon="🔥" color="#ef4444" sub={`${stats.total_incidents} total`} />
        <KpiCard title="Resources Deployed" value={stats.deployed_resources} icon="🚛" color="#3b82f6" sub={`${stats.available_resources} available`} />
        <KpiCard title="Pending Approvals" value={stats.pending_approvals} icon="⏳" color="#f59e0b" sub="Awaiting operator" />
        <KpiCard title="Avg Response Time" value={stats.avg_response_time_minutes} icon="⚡" color="#6366f1" sub="Minutes" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel rounded-xl p-5">
          <h3 className="text-base font-semibold mb-3 text-gray-300">Incidents by Severity</h3>
          <canvas ref={barRef} className="w-full" style={{ height: 200 }} />
        </div>
        <div className="glass-panel rounded-xl p-5">
          <h3 className="text-base font-semibold mb-3 text-gray-300">Resource Utilization</h3>
          <canvas ref={donutRef} className="w-full" style={{ height: 200 }} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Incidents by Status */}
        <div className="glass-panel rounded-xl p-5">
          <h3 className="text-base font-semibold mb-3 text-gray-300">Incident Status</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.incidents_by_status || {}).map(([k, v]: any) => (
              <span key={k} className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-gray-800 border border-gray-700 text-gray-300">
                {k}: <strong className="text-white">{v}</strong>
              </span>
            ))}
          </div>
          {stats.allocation_efficiency !== undefined && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Allocation Efficiency</span>
                <span className="font-mono">{(stats.allocation_efficiency * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                     style={{ width: `${stats.allocation_efficiency * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="glass-panel rounded-xl p-5">
          <h3 className="text-base font-semibold mb-3 text-gray-300">Recent Activity</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(stats.recent_activity || []).slice(0, 12).map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-3 text-xs py-1.5 border-b border-gray-800 last:border-0">
                <span className="flex-shrink-0 w-5 text-center">
                  {a.action === 'CREATE' ? '➕' : a.action === 'APPROVE' ? '✅' : a.action === 'REJECT' ? '❌' : '📝'}
                </span>
                <span className="text-gray-300 flex-1 truncate">{a.action} {a.entity_type} — {a.details || a.entity_id?.slice(0,8)}</span>
                <span className="text-gray-500 font-mono flex-shrink-0">{timeAgo(a.timestamp)}</span>
              </div>
            ))}
            {(!stats.recent_activity || stats.recent_activity.length === 0) && (
              <div className="text-gray-500 text-sm py-4 text-center">No recent activity. Interact with incidents to create audit entries.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

(window as any).Dashboard = Dashboard;
