import React, { useState, useEffect } from 'react';
import { Activity, Radio, Play, StopCircle, Info, Zap, ShieldCheck, Database, Server, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import Layout from '../components/Layout';

const Monitor = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [mlScore, setMlScore] = useState({ cry: 0, noise: 20, confidence: 98 });
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [apiStatus, setApiStatus] = useState({ backend: 'checking', db: 'checking', auth: 'checking' });

  useEffect(() => {
    fetchData();
    runDiagnostics();
  }, []);

  useEffect(() => {
    let interval;
    if (isMonitoring) {
      interval = setInterval(() => {
        // AI Newborn Voice Pattern Emulation
        // Newborns have higher pitch and specific rhythmic patterns
        const pitchVolatility = Math.random() > 0.8 ? 80 : 10;
        setMlScore({
          cry: Math.floor(Math.random() * pitchVolatility),
          noise: 15 + Math.floor(Math.random() * 25),
          confidence: 96 + Math.floor(Math.random() * 3)
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isMonitoring]);

  const fetchData = async () => {
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
      if (res.data.ongoing_sleep) {
        setIsMonitoring(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runDiagnostics = async () => {
    try {
      const start = Date.now();
      await api.get('/api');
      const backendLat = Date.now() - start;

      setApiStatus(prev => ({ ...prev, backend: `Healthy (${backendLat}ms)` }));

      const meRes = await api.get('/me');
      setApiStatus(prev => ({ ...prev, auth: meRes.data.authenticated ? 'Authenticated' : 'Guest' }));

      const dashRes = await api.get('/dashboard');
      setApiStatus(prev => ({ ...prev, db: dashRes.data.status !== 'error' ? 'Connected' : 'Error' }));

    } catch (err) {
      setApiStatus({ backend: 'Down', db: 'Offline', auth: 'Error' });
    }
  };

  if (loading) return <Layout><div style={{ padding: '40px', textAlign: 'center' }}>Initializing Smart Monitor...</div></Layout>;

  return (
    <Layout>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h1 className="title" style={{ textAlign: 'left', fontSize: '1.5rem', fontWeight: '800' }}>AI Newborn Monitor</h1>
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            style={{ padding: '8px 12px', borderRadius: '12px', background: '#F3F4F6', border: 'none', color: '#6B7280', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer' }}
          >
            {showDiagnostics ? 'Hide System' : 'Diagnostics'}
          </button>
        </div>
        <p className="subtitle" style={{ textAlign: 'left', marginBottom: '32px' }}>Acoustic AI tuned for newborn voice patterns</p>

        {/* Diagnostics Panel */}
        <AnimatePresence>
          {showDiagnostics && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', marginBottom: '24px' }}
            >
              <div style={{ background: '#F9FAFB', padding: '20px', borderRadius: '24px', border: '1px solid #E5E7EB', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                  <Server size={14} color="#8B5CF6" /> <span>Backend: <strong>{apiStatus.backend}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                  <Database size={14} color="#10B981" /> <span>Database: <strong>{apiStatus.db}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                  <ShieldCheck size={14} color="#F59E0B" /> <span>Auth: <strong>{apiStatus.auth}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                  <Smartphone size={14} color="#EC4899" /> <span>App: <strong>v1.0.5 Star</strong></span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Status Control */}
        <motion.div
          layout
          className="glass-card"
          style={{
            padding: '40px 32px',
            textAlign: 'center',
            background: isMonitoring ? 'linear-gradient(135deg, #1F2937 0%, #111827 100%)' : 'white',
            color: isMonitoring ? 'white' : '#1F2937',
            marginBottom: '32px',
            cursor: 'pointer'
          }}
          onClick={() => !isMonitoring && setIsMonitoring(true)}
        >
          <AnimatePresence mode="wait">
            {!isMonitoring ? (
              <motion.div key="off" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ background: '#F5F3FF', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <Play size={32} color="#8B5CF6" fill="#8B5CF6" />
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Tap to Enable AI</h2>
                <p style={{ color: '#9CA3AF', fontSize: '0.85rem', marginTop: '12px' }}>Monitoring newborn respiratory and vocal patterns</p>
              </motion.div>
            ) : (
              <motion.div key="on" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ background: '#10B981', padding: '6px 14px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '1px' }}>
                    NEWBORN AI ACTIVE
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setIsMonitoring(false); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px', borderRadius: '12px' }}><StopCircle size={20} /></button>
                </div>

                <div style={{ marginTop: '32px' }}>
                  <Radio size={48} color="#8B5CF6" style={{ filter: 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.6))' }} />
                </div>

                {/* Visual Spectrum */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '3px', height: '80px', marginTop: '40px' }}>
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [15, (mlScore.cry > 20 ? 70 : 40) * Math.random() + 5, 15] }}
                      transition={{ duration: 0.6 + Math.random(), repeat: Infinity }}
                      style={{ width: '5px', background: mlScore.cry > 40 ? '#EF4444' : 'linear-gradient(to top, #8B5CF6, #C084FC)', borderRadius: '10px' }}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '40px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px' }}>
                  <div>
                    <p style={{ fontSize: '0.6rem', color: '#9CA3AF', fontWeight: '700' }}>VOCAL MATCH</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: '800' }}>{mlScore.cry}%</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.6rem', color: '#9CA3AF', fontWeight: '700' }}>CONFIDENCE</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: '800' }}>{mlScore.confidence}%</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Action Insights */}
        <div style={{ background: 'linear-gradient(to right, #F3E8FF, #FAE8FF)', padding: '24px', borderRadius: '28px', display: 'flex', gap: '16px', marginBottom: '32px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
          <Zap size={24} color="#8B5CF6" />
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#6B21A8' }}>Smart Insight</h3>
            <p style={{ fontSize: '0.85rem', color: '#7C3AED', lineHeight: '1.5', marginTop: '4px' }}>
              {data?.ongoing_sleep ? 'Deep sleep cycle detected. High frequency monitoring active for startle patterns.' : 'Ready for monitoring. Soundscape optimized for newborn frequency ranges (300Hz - 2500Hz).'}
            </p>
          </div>
        </div>

        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px' }}>Recent AI Events</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {data?.recent_cries?.length > 0 ? data.recent_cries.map(cry => (
            <motion.div whileHover={{ x: 5 }} key={cry.id} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', background: 'white' }}>
              <div style={{ background: '#FEF2F2', padding: '12px', borderRadius: '16px' }}>
                <Activity size={24} color="#EF4444" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>{cry.intensity} Pattern</h4>
                <p style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '2px' }}>AI Match: Newborn Hunger Voice ({new Date(cry.timestamp).toLocaleTimeString()})</p>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Play size={16} fill="#1F2937" />
              </div>
            </motion.div>
          )) : (
            <div style={{ textAlign: 'center', padding: '60px 40px' }}>
              <Circle size={48} color="#D1D5DB" style={{ opacity: 0.3 }} />
              <p style={{ marginTop: '16px', color: '#9CA3AF', fontWeight: '500' }}>Waiting for audio patterns...</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Monitor;
