import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';

const VerifyOTP = ({ onAuth }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const phone = location.state?.phone || '';

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('phone', phone);
      formData.append('otp', otp);
      const res = await api.post('/login/verify', formData);
      if (res.data.status === 'success') {
        onAuth(); // Refresh user state in App.jsx
        navigate('/');
      }
    } catch (err) {
      alert('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="auth-container"
    >
      <button onClick={() => navigate('/login')} style={{ border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', cursor: 'pointer' }}>
        <ArrowLeft size={20} />
        Back
      </button>

      <div className="logo-section" style={{ textAlign: 'center' }}>
        <div style={{ background: 'var(--primary)', width: '64px', height: '64px', borderRadius: '20px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <ShieldCheck size={32} />
        </div>
        <h1 className="title" style={{ marginTop: '24px' }}>Verify Identity</h1>
        <p className="subtitle">Sent to {phone}</p>
      </div>

      <div className="card">
        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <input 
            type="text" 
            placeholder="Enter 4-digit OTP" 
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={4}
            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: '700' }}
            required
          />
          <button type="submit" className="primary-btn" disabled={loading || otp.length < 4}>
            {loading ? 'Verifying...' : 'Verify & Proceed'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-muted)' }}>
          Didn't receive code? <span style={{ color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}>Resend</span>
        </p>
      </div>
    </motion.div>
  );
};

export default VerifyOTP;
