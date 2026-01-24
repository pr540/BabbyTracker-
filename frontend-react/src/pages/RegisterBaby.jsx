import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';

const RegisterBaby = ({ onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Girl',
    birth_date: '',
    weight: ''
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (photo) data.append('photo', photo);

      await api.post('/register-baby', data);
      onUpdate();
      navigate('/');
    } catch (err) {
      alert('Failed to register baby. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="auth-container"
      style={{ padding: '24px' }}
    >
      <h1 className="title" style={{ textAlign: 'left', fontSize: '1.5rem' }}>Welcome!</h1>
      <p className="subtitle" style={{ textAlign: 'left' }}>Let's set up your baby's profile to begin tracking.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <label style={{ width: '120px', height: '120px', borderRadius: '40px', border: '2px dashed #D1D5DB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', background: '#F9FAFB' }}>
            {photo ? (
              <img src={URL.createObjectURL(photo)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
            ) : (
              <>
                  <Camera size={32} color="#9CA3AF" />
                  <span style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '8px' }}>Add Photo</span>
              </>
            )}
            <input type="file" hidden onChange={(e) => setPhoto(e.target.files[0])} />
          </label>
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>Baby's Name</label>
          <input 
            placeholder="What should we call the little one?"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            style={{ padding: '16px' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>Gender</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, gender: 'Boy' })}
              style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '2px solid', borderColor: formData.gender === 'Boy' ? 'var(--primary)' : '#F3F4F6', background: formData.gender === 'Boy' ? '#F3E8FF' : 'white', fontWeight: '700', color: formData.gender === 'Boy' ? 'var(--primary)' : '#6B7280', transition: 'all 0.2s' }}
            >
              Boy
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, gender: 'Girl' })}
              style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '2px solid', borderColor: formData.gender === 'Girl' ? 'var(--primary)' : '#F3F4F6', background: formData.gender === 'Girl' ? '#F3E8FF' : 'white', fontWeight: '700', color: formData.gender === 'Girl' ? 'var(--primary)' : '#6B7280', transition: 'all 0.2s' }}
            >
              Girl
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>Birth Date</label>
            <input
              type="date" 
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              required
              style={{ padding: '16px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>Weight (kg)</label>
            <input 
              placeholder="e.g. 3.2"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              style={{ padding: '16px' }}
            />
          </div>
        </div>

        <button type="submit" className="primary-btn" disabled={loading} style={{ height: '60px', marginTop: '12px' }}>
          <Save size={20} />
          {loading ? 'Saving Profile...' : 'Complete Registration'}
        </button>
      </form>
    </motion.div>
  );
};

export default RegisterBaby;
