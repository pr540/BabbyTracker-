import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('phone', phone);
      const res = await api.post('/login/otp', formData);
      navigate('/verify-otp', { state: { phone, debugOtp: res.data.otp_debug } });
    } catch (err) {
      console.error('OTP Send Error:', err);
      // Fallback for network errors that don't have response
      const errorMessage = err.response?.data?.detail
        || err.response?.data?.message
        || err.message
        || 'Network Error - Check Backend';
      alert('Failed to send OTP: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="auth-container"
    >
      <div className="logo-section" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ background: 'var(--primary)', width: '64px', height: '64px', borderRadius: '20px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <Phone size={32} />
        </div>
        <h1 className="title" style={{ marginTop: '24px' }}>BabyTracker</h1>
        <p className="subtitle">Premium care for your little one</p>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Login</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Enter your mobile number to receive an OTP</p>

        <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <Phone size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="tel"
              placeholder="Mobile Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ paddingLeft: '48px' }}
              required
              pattern="[0-9]{10}"
            />
          </div>
          <button type="submit" className="primary-btn" disabled={loading || phone.length < 10}>
            {loading ? 'Sending...' : 'Get OTP'}
            <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default Login;
