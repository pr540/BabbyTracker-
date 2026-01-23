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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="auth-container"
    >
      <h1 className="title">New Baby</h1>
      <p className="subtitle">Let's set up your baby's profile</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <label style={{ width: '100px', height: '100px', borderRadius: '32px', border: '2px dashed #D1D5DB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
            {photo ? (
              <img src={URL.createObjectURL(photo)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
            ) : (
              <>
                <Camera size={24} color="var(--text-muted)" />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Photo</span>
              </>
            )}
            <input type="file" hidden onChange={(e) => setPhoto(e.target.files[0])} />
          </label>
        </div>

        <input 
          placeholder="Baby's Name" 
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            type="button" 
            onClick={() => setFormData({...formData, gender: 'Boy'})}
            style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '2px solid', borderColor: formData.gender === 'Boy' ? 'var(--primary)' : '#F3F4F6', background: formData.gender === 'Boy' ? '#F3E8FF' : 'white', fontWeight: '600', transition: 'all 0.2s' }}
          >
            Boy
          </button>
          <button 
            type="button" 
            onClick={() => setFormData({...formData, gender: 'Girl'})}
            style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '2px solid', borderColor: formData.gender === 'Girl' ? 'var(--primary)' : '#F3F4F6', background: formData.gender === 'Girl' ? '#F3E8FF' : 'white', fontWeight: '600', transition: 'all 0.2s' }}
          >
            Girl
          </button>
        </div>

        <input 
          type="date" 
          placeholder="Birth Date" 
          value={formData.birth_date}
          onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
          required
        />

        <input 
          placeholder="Weight (kg)" 
          value={formData.weight}
          onChange={(e) => setFormData({...formData, weight: e.target.value})}
        />

        <button type="submit" className="primary-btn" disabled={loading}>
          <Save size={20} />
          {loading ? 'Saving...' : 'Complete Registration'}
        </button>
      </form>
    </motion.div>
  );
};

export default RegisterBaby;
