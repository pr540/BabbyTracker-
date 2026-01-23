import React, { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Settings, Plus, Activity, Home, List, Mic, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSleep = async () => {
    try {
      await api.post('/sleep/toggle');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      await api.post(`/task/toggle/${taskId}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Dashboard...</div>;
  if (!data) return <div style={{ padding: '40px', textAlign: 'center' }}>Error loading data.</div>;

  return (
    <div style={{ paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{data.baby.name}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div style={{ position: 'relative' }}>
          {data.baby.photo_url ? (
            <img src={`http://localhost:8000${data.baby.photo_url}`} style={{ width: '48px', height: '48px', borderRadius: '16px', objectFit: 'cover' }} alt="Baby" />
          ) : (
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={24} color="var(--text-muted)" />
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '0 24px' }}>
        <motion.div whileTap={{ scale: 0.95 }} className="glass-card" style={{ padding: '20px', background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', color: 'white' }}>
          <Activity size={24} style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '0.9rem', opacity: 0.8 }}>Cry Alerts</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: '700' }}>{data.cry_count_today}</p>
        </motion.div>
        <motion.div whileTap={{ scale: 0.95 }} className="glass-card" style={{ padding: '20px', background: 'white', border: '1.5px solid #F3F4F6' }}>
          <Moon size={24} style={{ marginBottom: '12px', color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Sleep Total</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: '700' }}>{data.sleep_duration_today}</p>
        </motion.div>
      </div>

      {/* Baby Status Card */}
      <div style={{ padding: '24px' }}>
        <div className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '4px' }}>
                {data.ongoing_sleep ? 'Baby is Sleeping' : 'Baby is Awake'}
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Since {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <button onClick={handleToggleSleep} className="primary-btn" style={{ borderRadius: '50px', padding: '12px 24px' }}>
              {data.ongoing_sleep ? <Sun size={20} /> : <Moon size={20} />}
              {data.ongoing_sleep ? 'Wake Up' : 'Log Sleep'}
            </button>
          </div>
          
          {/* Animated Wave for Sleep */}
          {data.ongoing_sleep && (
            <motion.div 
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: 'var(--primary)' }} 
            />
          )}
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div style={{ padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Today's Routine</h2>
          <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: '600' }}>View All</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data.tasks.map(task => (
            <div key={task.id} className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', background: task.is_completed ? '#F9FAFB' : 'white' }}>
              <input 
                type="checkbox" 
                checked={task.is_completed} 
                onChange={() => handleToggleTask(task.id)}
                style={{ width: '24px', height: '24px', cursor: 'pointer' }}
              />
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: '600', textDecoration: task.is_completed ? 'line-through' : 'none', color: task.is_completed ? 'var(--text-muted)' : 'var(--text)' }}>{task.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{task.due_time} • {task.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="nav-bar">
        <a href="#" className="nav-item active"><Home size={24} />Home</a>
        <a href="#" className="nav-item"><List size={24} />Tasks</a>
        <div style={{ marginTop: '-24px', background: 'var(--primary)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          <Mic size={24} />
        </div>
        <a href="#" className="nav-item"><Activity size={24} />Monitor</a>
        <a href="#" className="nav-item"><Settings size={24} />Profile</a>
      </div>
    </div>
  );
};

export default Dashboard;
