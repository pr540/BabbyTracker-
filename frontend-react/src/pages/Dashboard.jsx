import React, { useState, useEffect } from 'react';
import { Moon, Sun, Activity, User, Plus, Star, ChevronRight, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import Layout from '../components/Layout';

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

  if (loading) return <Layout><div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div><p style={{ marginTop: '20px', color: '#6B7280' }}>Loading your dashboard...</p></div></Layout>;

  if (!data || !data.baby) return <Layout><div style={{ padding: '40px', textAlign: 'center' }}>Welcome to BabyTracker! Please complete registration.</div></Layout>;

  return (
    <Layout>
      {/* Premium Header */}
      <div style={{ padding: '32px 24px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#1F2937' }}>{data.baby.name}</h1>
            <div style={{ background: 'linear-gradient(135deg, #FCD34D, #F59E0B)', padding: '4px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.2)' }}>
              <Star size={12} color="white" fill="white" />
              <span style={{ fontSize: '0.65rem', fontWeight: '900', color: 'white' }}>ELITE</span>
            </div>
          </div>
          <p style={{ color: '#9CA3AF', fontSize: '0.9rem', fontWeight: '500' }}>{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          {data.baby.photo_url ? (
            <img src={`${api.defaults.baseURL.replace('/api', '')}${data.baby.photo_url}`} style={{ width: '56px', height: '56px', borderRadius: '20px', objectFit: 'cover', border: '3px solid white', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }} alt="Baby" />
          ) : (
              <div style={{ width: '56px', height: '56px', borderRadius: '20px', background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
                <User size={28} color="#8B5CF6" />
            </div>
          )}
        </motion.div>
      </div>

      {/* Hero Stats Card */}
      <div style={{ padding: '0 24px' }}>
        <div className="glass-card" style={{
          padding: '28px',
          background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: '700', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Current Wellbeing</p>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginTop: '4px' }}>{data.ongoing_sleep ? 'Resting Peacefully' : 'Active & Happy'}</h2>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '16px' }}>
              {data.ongoing_sleep ? <Moon size={24} /> : <Sun size={24} />}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: '600', opacity: 0.8 }}>Cry Score</p>
              <p style={{ fontSize: '1.25rem', fontWeight: '900', marginTop: '2px' }}>{data.cry_count_today} Alerts</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: '600', opacity: 0.8 }}>Total Rest</p>
              <p style={{ fontSize: '1.25rem', fontWeight: '900', marginTop: '2px' }}>{data.sleep_duration_today}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Control */}
      <div style={{ padding: '0 24px 32px' }}>
        <motion.div 
          whileHover={{ scale: 1.02 }}
          onClick={handleToggleSleep}
          className="glass-card"
          style={{
            padding: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'white',
            borderLeft: `6px solid ${data.ongoing_sleep ? '#10B981' : '#F59E0B'}`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: data.ongoing_sleep ? '#ECFDF5' : '#FFFBEB', padding: '12px', borderRadius: '16px' }}>
              {data.ongoing_sleep ? <Sun color="#10B981" size={24} /> : <Moon color="#F59E0B" size={24} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#1F2937' }}>{data.ongoing_sleep ? 'Wake up Baby' : 'Start Nap Session'}</h3>
              <p style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>{data.ongoing_sleep ? 'Timer active since log' : 'Track next recovery stage'}</p>
            </div>
          </div>
          <ChevronRight color="#D1D5DB" />
        </motion.div>
      </div>

      {/* Premium Notification Simulation */}
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ background: '#F5F2FF', padding: '16px 20px', borderRadius: '24px', border: '1px solid #DDD6FE', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'white', padding: '10px', borderRadius: '14px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
            <Bell size={20} color="#8B5CF6" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#5B21B6' }}>Smart Recommendation</p>
            <p style={{ fontSize: '0.75rem', color: '#7C3AED', marginTop: '2px' }}>Next feeding window is in 45 minutes.</p>
          </div>
        </div>
      </div>

      {/* Task List Preview */}
      <div style={{ padding: '0 24px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1F2937' }}>Baby Daily Routine</h2>
          <span style={{ color: '#8B5CF6', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}>Manage</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {data.tasks && data.tasks.length > 0 ? data.tasks.slice(0, 3).map(task => (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={task.id} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', background: task.is_completed ? '#F9FAFB' : 'white' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '8px', border: '2.5px solid #E5E7EB', flexShrink: 0, background: task.is_completed ? '#8B5CF6' : 'transparent', borderColor: task.is_completed ? '#8B5CF6' : '#E5E7EB', transition: 'all 0.2s' }}>
                {task.is_completed && <ChevronRight size={18} color="white" style={{ margin: '0 auto' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: task.is_completed ? '#9CA3AF' : '#1F2937' }}>{task.title}</h4>
                <p style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: '500' }}>{task.due_time} • {task.action_type}</p>
              </div>
              {task.photo_url ? (
                <img src={`${api.defaults.baseURL.replace('/api', '')}${task.photo_url}`} style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' }} alt="Task" />
              ) : (
                <Plus size={20} color="#D1D5DB" />
              )}
            </motion.div>
          )) : (
            <div style={{ padding: '60px 40px', textAlign: 'center', background: '#FDFCFF', borderRadius: '32px', border: '2px dashed #E5E7EB' }}>
              <Activity size={32} color="#D1D5DB" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: '#9CA3AF', fontSize: '0.9rem', fontWeight: '500' }}>Your routine is empty today.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
