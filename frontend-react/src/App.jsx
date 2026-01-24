import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import VerifyOTP from './pages/VerifyOTP';
import Dashboard from './pages/Dashboard';
import RegisterBaby from './pages/RegisterBaby';
import Profile from './pages/Profile';
import Tasks from './pages/Tasks';
import Monitor from './pages/Monitor';
import Analysis from './pages/Analysis';
import api from './api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await api.get('/me');
      if (res.data.authenticated) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #8B5CF6', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#6B7280', fontWeight: '500' }}>Loading BabyTracker...</p>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <Router>
      <div className="app-shell">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/verify-otp" element={!user ? <VerifyOTP onAuth={checkAuth} /> : <Navigate to="/" />} />
          <Route path="/register-baby" element={user && !user.has_baby ? <RegisterBaby onUpdate={checkAuth} /> : <Navigate to="/" />} />

          {/* Protected Routes */}
          <Route path="/" element={user ? (user.has_baby ? <Dashboard /> : <Navigate to="/register-baby" />) : <Navigate to="/login" />} />
          <Route path="/tasks" element={user && user.has_baby ? <Tasks /> : <Navigate to="/login" />} />
          <Route path="/monitor" element={user && user.has_baby ? <Monitor /> : <Navigate to="/login" />} />
          <Route path="/analysis" element={user && user.has_baby ? <Analysis /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user && user.has_baby ? <Profile onUpdate={checkAuth} /> : <Navigate to="/login" />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
