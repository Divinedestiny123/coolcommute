'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, ThermometerSun, Users, AlertTriangle, Loader2, Check } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    // Refresh every 5 seconds to simulate live dashboard
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        // Trigger an immediate re-fetch of stats
        const statsRes = await fetch('/api/stats');
        const statsJson = await statsRes.json();
        setData(statsJson);
        showToast('Successfully synced with live FortyGuard data!', 'success');
      } else {
        showToast("Sync failed: " + (json.error || "Unknown error"), 'error');
      }
    } catch (err) {
      console.error('Failed to sync', err);
      showToast("Network error during sync.", 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: toast.type === 'error' ? '#EF4444' : '#10B981',
          color: '#fff',
          padding: '0.75rem 1.5rem',
          borderRadius: 'var(--border-radius-sm)',
          fontWeight: 500,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'fadeIn 0.3s ease-in-out'
        }}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <Check size={18} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link href="/" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>City Planner Dashboard</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', border: '1px dashed var(--accent-primary)', borderRadius: 'var(--border-radius-sm)', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
            {isSyncing ? 'Syncing with FortyGuard...' : 'Sync Live Heat Data'}
          </button>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: '1rem' }}>Live Data: <span style={{ color: 'var(--accent-success)' }}>Active</span></span>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {loading && !data ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Loader2 className="animate-spin" size={48} color="var(--accent-primary)" />
          </div>
        ) : (
          <>
            {/* Top Stats Row */}
            <div className="dashboard-row">
              
              <div className="glass-card dashboard-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ThermometerSun size={20} />
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Avg City Temperature</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 700 }}>{data?.stats?.avg_city_temp?.toFixed(1)}°F</h3>
                  <p style={{ color: 'var(--accent-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>+2.1°F vs Yesterday</p>
                </div>
              </div>

              <div className="glass-card dashboard-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Active Heat Islands</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 700 }}>{data?.stats?.active_heat_islands}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>High Risk Zones</p>
                </div>
              </div>

              <div className="glass-card dashboard-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={20} />
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Citizens Re-routed</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 700 }}>{data?.stats?.citizens_rerouted?.toLocaleString()}</h3>
                  <p style={{ color: 'var(--accent-success)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Avoiding extreme heat</p>
                </div>
              </div>

              <div className="glass-card dashboard-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={20} />
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>System Health</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 700 }}>99.9%</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>FortyGuard API Latency: 42ms</p>
                </div>
              </div>

            </div>

            {/* Bottom Split */}
            <div className="dashboard-content-grid">
              
              {/* Main Chart Area (Mock for now) */}
              <div className="glass-card dashboard-card" style={{ flex: 2, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Heat Distribution Map (Live Stats)</h3>
                <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--glass-border)', color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Total Routes Optimized</p>
                  <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{data?.stats?.routes_calculated?.toLocaleString()}</div>
                  <p style={{ marginTop: '1rem' }}>Citizens are actively using the app to avoid the heat.</p>
                </div>
              </div>

              {/* List Area */}
              <div className="glass-card dashboard-card" style={{ flex: 1, padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Top Heat Islands</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {data?.islands?.map((island, index) => (
                    <div key={island.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{island.name}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{island.temperature}°F • {island.risk_level}</div>
                      </div>
                      <div style={{ color: index === 0 ? 'var(--accent-secondary)' : 'var(--accent-warning)' }}>
                        <AlertTriangle size={18} />
                      </div>
                    </div>
                  ))}

                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
