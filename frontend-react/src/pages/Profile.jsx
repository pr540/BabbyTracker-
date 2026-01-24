import React, { useState, useEffect } from 'react';
import { Camera, Save, ArrowLeft, Trash2, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';
import Layout from '../components/Layout';

const Profile = ({ onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Girl',
    birth_date: '',
    weight: ''
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBaby();
  }, []);

  const fetchBaby = async () => {
    try {
      const res = await api.get('/dashboard');
      if (res.data.baby) {
        const b = res.data.baby;
        setFormData({
          name: b.name || '',
          gender: b.gender || 'Girl',
          birth_date: b.birth_date || '',
          weight: b.weight || ''
        });
        if (b.photo_url) {
          setPreview(`${api.defaults.baseURL.replace('/api', '')}${b.photo_url}`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (photo) data.append('photo', photo);

      // Note: Reusing register-baby logic as backend doesn't have update yet.
      // But in a real app, we'd call a dedicated update endpoint.
      // For now, let's assume register-baby handles UPSERT or we add a new endpoint.
      await api.post('/register-baby', data); 
      
      alert('Profile updated successfully!');
      onUpdate();
    } catch (err) {
      console.error(err);
      alert('Failed to update. Backend might need update endpoint.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.get('/logout');
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Profile...</div>;

  return (
    <Layout>
      <div style={{ padding: '24px' }}>
        <h1 className="title" style={{ textAlign: 'left', fontSize: '1.5rem' }}>Baby Profile</h1>
        <p className="subtitle" style={{ textAlign: 'left' }}>Complete your baby's details here</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <label style={{ width: '120px', height: '120px', borderRadius: '40px', border: '2px dashed #D1D5DB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative', background: '#F3F4F6' }}>
              {preview ? (
                <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
              ) : (
                <>
                  <Camera size={32} color="#9CA3AF" />
                  <span style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '8px' }}>Add Photo</span>
                </>
              )}
              <input type="file" hidden onChange={handlePhotoChange} />
              <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.3)', padding: '4px', display: 'flex', justifyContent: 'center' }}>
                <Camera size={14} color="white" />
              </div>
            </label>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>Baby's Name</label>
            <input 
              placeholder="Enter name" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>Gender</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                onClick={() => setFormData({...formData, gender: 'Boy'})}
                style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '2px solid', borderColor: formData.gender === 'Boy' ? 'var(--primary)' : '#F3F4F6', background: formData.gender === 'Boy' ? '#F3E8FF' : 'white', fontWeight: '700', color: formData.gender === 'Boy' ? 'var(--primary)' : '#6B7280', transition: 'all 0.2s' }}
              >
                Boy
              </button>
              <button 
                type="button" 
                onClick={() => setFormData({...formData, gender: 'Girl'})}
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
                onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>Weight (kg)</label>
              <input 
                placeholder="e.g. 3.5" 
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: e.target.value})}
              />
            </div>
          </div>

          <button type="submit" className="primary-btn" disabled={saving}>
            <Save size={20} />
            {saving ? 'Saving...' : 'Update Details'}
          </button>

          <button type="button" onClick={handleLogout} style={{ marginTop: '20px', padding: '16px', borderRadius: '16px', border: '2px solid #FEE2E2', background: 'white', color: '#EF4444', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <LogOut size={20} />
            Logout Account
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default Profile;
