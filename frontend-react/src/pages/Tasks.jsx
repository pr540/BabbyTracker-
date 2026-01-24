import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle2, Circle, Clock, Camera, ChevronRight, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import Layout from '../components/Layout';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('Daily'); // Day, Daily, Weekly, Monthly
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    action_type: 'Daily',
    time: '',
    intervals_time: '',
    interval_count: 1
  });
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/dashboard');
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      await api.post(`/task/toggle/${taskId}`);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', formData.name);
    data.append('action_type', formData.action_type);
    data.append('due_time', formData.time);
    data.append('interval_minutes', formData.intervals_time || 0);
    data.append('interval_count', formData.interval_count);
    if (photo) data.append('photo', photo);

    try {
      await api.post('/task/create', data);
      setShowAddModal(false);
      fetchTasks();
      // Reset form
      setFormData({ name: '', action_type: 'Daily', time: '', intervals_time: '', interval_count: 1 });
      setPhoto(null);
    } catch (err) {
      alert('Error creating task');
    }
  };

  if (loading) return <Layout><div style={{ padding: '40px', textAlign: 'center' }}>Loading Baby Tasks...</div></Layout>;

  return (
    <Layout>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h1 className="title" style={{ textAlign: 'left', fontSize: '1.5rem', fontWeight: '800' }}>Baby Tasks</h1>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAddModal(true)}
            className="primary-btn"
            style={{ borderRadius: '50%', padding: '0', width: '48px', height: '48px', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}
          >
            <Plus size={24} />
          </motion.button>
        </div>

        {/* Calendar / Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
          {['Day', 'Daily', 'Weekly', 'Monthly'].map(t => (
            <button
              key={t}
              onClick={() => setView(t)}
              style={{
                padding: '8px 16px',
                borderRadius: '50px',
                border: 'none',
                background: view === t ? 'var(--primary)' : '#F3F4F6',
                color: view === t ? 'white' : '#6B7280',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tasks.filter(t => t.action_type === view || view === 'Day').length > 0 ? (
            tasks.filter(t => t.action_type === view || view === 'Day').map(task => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card"
                style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', background: task.is_completed ? '#F9FAFB' : 'white', cursor: 'pointer' }}
              >
                <div onClick={() => handleToggleTask(task.id)}>
                  {task.is_completed ? (
                    <CheckCircle2 color="#8B5CF6" size={28} />
                  ) : (
                    <Circle color="#D1D5DB" size={28} />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', textDecoration: task.is_completed ? 'line-through' : 'none', color: task.is_completed ? '#9CA3AF' : '#1F2937' }}>{task.title}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {task.due_time}
                    </span>
                    {task.interval_minutes > 0 && (
                      <span style={{ fontSize: '0.75rem', color: '#8B5CF6', background: '#F5F3FF', padding: '2px 8px', borderRadius: '4px' }}>
                        Every {task.interval_minutes}m
                      </span>
                    )}
                  </div>
                </div>

                {task.photo_url && (
                  <img src={`${api.defaults.baseURL.replace('/api', '')}${task.photo_url}`} style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover' }} alt="Task" />
                )}

                <div style={{ color: '#D1D5DB' }}>
                  <ChevronRight size={20} />
                </div>
              </motion.div>
            ))
          ) : (
            <div style={{ padding: '80px 40px', textAlign: 'center', color: '#9CA3AF' }}>
              <Calendar size={64} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontWeight: '500' }}>No {view} tasks scheduled.</p>
            </div>
          )}
        </div>
      </div>

      {/* Pre-notification Simulation */}
      <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 1000 }}>
        <AnimatePresence>
          {tasks.some(t => !t.is_completed) && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ background: 'white', padding: '12px 16px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #F3F4F6' }}
            >
              <div style={{ background: '#F5F3FF', padding: '8px', borderRadius: '8px' }}>
                <Bell size={18} color="#8B5CF6" />
              </div>
              <p style={{ fontSize: '0.8rem', fontWeight: '600' }}>Next task in 15 mins</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              style={{ background: 'white', width: '100%', maxWidth: '480px', margin: '0 auto', borderRadius: '32px 32px 0 0', padding: '32px', boxShadow: '0 -10px 30px rgba(0,0,0,0.1)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Schedule Task</h2>
                <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: '#F3F4F6', borderRadius: '50%', padding: '4px' }}><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6B7280' }}>Action Type</label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    {['Day', 'Daily', 'Weekly', 'Monthly'].map(t => (
                      <button key={t} type="button" onClick={() => setFormData({ ...formData, action_type: t })} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid', borderColor: formData.action_type === t ? 'var(--primary)' : '#E5E7EB', background: formData.action_type === t ? '#F5F3FF' : 'white', color: formData.action_type === t ? 'var(--primary)' : '#6B7280', fontSize: '0.75rem', fontWeight: '700' }}>{t}</button>
                    ))}
                  </div>
                </div>

                <input placeholder="Task Name (e.g. Feeding)" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6B7280' }}>Start Time</label>
                    <input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} required />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6B7280' }}>Photo</label>
                    <label style={{ height: '48px', border: '1px solid #E5E7EB', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '8px', color: '#9CA3AF' }}>
                      <Camera size={18} />
                      <span style={{ fontSize: '0.8rem' }}>{photo ? 'Added' : 'Upload'}</span>
                      <input type="file" hidden onChange={e => setPhoto(e.target.files[0])} />
                    </label>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6B7280' }}>Interval (mins)</label>
                    <input type="number" placeholder="0" value={formData.intervals_time} onChange={e => setFormData({ ...formData, intervals_time: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6B7280' }}># of Intervals</label>
                    <input type="number" value={formData.interval_count} onChange={e => setFormData({ ...formData, interval_count: e.target.value })} />
                  </div>
                </div>

                <button type="submit" className="primary-btn" style={{ height: '60px', marginTop: '10px' }}>Create Task</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Tasks;
