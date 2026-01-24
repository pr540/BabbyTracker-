import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, RefreshCw, CheckCircle2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

const VerifyOTP = ({ onAuth }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [showNotification, setShowNotification] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();
  const phone = location.state?.phone || '';
  const [debugOtp, setDebugOtp] = useState(location.state?.debugOtp || null); // Capture OTP for easy testing

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Hide notification after 8 seconds
  useEffect(() => {
    if (showNotification) {
      const timeout = setTimeout(() => setShowNotification(false), 8000);
      return () => clearTimeout(timeout);
    }
  }, [showNotification]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('phone', phone);
      formData.append('otp', otp);
      const res = await api.post('/login/verify', formData);
      if (res.data.status === 'success') {
        onAuth(); 
        navigate('/');
      }
    } catch (err) {
      console.error('Verification Error:', err);
      alert('Verification failed: ' + (err.response?.data?.detail || 'Invalid OTP.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('phone', phone);
      const res = await api.post('/login/otp', formData);

      // Capture the debug OTP if the backend sent it
      if (res.data.otp_debug) {
        setDebugOtp(res.data.otp_debug);
      }

      setTimer(30);
      setCanResend(false);
      setShowNotification(true);
      setOtp('');
    } catch (err) {
      console.error('Resend Error:', err);
      alert('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="auth-container"
      style={{ position: 'relative', minHeight: '100vh' }}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              background: '#10B981',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
              zIndex: 1000,
              width: '90%',
              maxWidth: '400px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={20} />
              <span style={{ fontWeight: '700' }}>OTP Request Successful</span>
            </div>
            <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>Check your terminal or phone messages.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={() => navigate('/login')} style={{ border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '24px', padding: '10px' }}>
        <ArrowLeft size={20} />
        Back to Login
      </button>

      <div className="logo-section" style={{ textAlign: 'center' }}>
        <div style={{ background: 'var(--primary)', width: '64px', height: '64px', borderRadius: '22px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 16px rgba(139, 92, 246, 0.2)' }}>
          <ShieldCheck size={32} />
        </div>
        <h1 className="title" style={{ marginTop: '24px' }}>Verify OTP</h1>
        <p className="subtitle">Sent to <strong>{phone}</strong></p>
      </div>

      <div className="card" style={{ marginTop: '40px', padding: '32px' }}>
        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="· · · ·"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              maxLength={4}
              autoFocus
              style={{
                textAlign: 'center',
                fontSize: '2.5rem',
                letterSpacing: '16px',
                fontWeight: '800',
                padding: '24px',
                background: '#F9FAFB',
                border: '2px solid #E5E7EB'
              }}
              required
            />
          </div>

          <button type="submit" className="primary-btn" disabled={loading || otp.length < 4} style={{ height: '60px', fontSize: '1.1rem' }}>
            {loading ? 'Confirming...' : 'Verify & Log In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          {timer > 0 ? (
            <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <RefreshCw size={16} style={{ animation: 'spin 2s linear infinite' }} />
              Resend available in <strong style={{ color: 'var(--primary)' }}>{timer}s</strong>
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ color: 'var(--text-muted)' }}>Didn't receive the code?</p>
              <button
                onClick={handleResend}
                disabled={loading}
                style={{
                  color: 'var(--primary)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  fontSize: '1rem',
                  textDecoration: 'underline'
                }}
              >
                Resend Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Debug Box - Only shown if backend sends the code (for dev testing) */}
      <AnimatePresence>
        {debugOtp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              marginTop: '24px',
              padding: '16px',
              background: '#F3E8FF',
              borderRadius: '12px',
              border: '1px dashed #8B5CF6',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <Info size={20} color="#8B5CF6" />
            <div>
              <p style={{ fontSize: '0.8rem', color: '#6B21A8', fontWeight: '600' }}>DEBUG MODE: Your code is</p>
              <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#7C3AED' }}>{debugOtp}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </motion.div>
  );
};

export default VerifyOTP;
