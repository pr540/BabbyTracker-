import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import VerifyOTP from './pages/VerifyOTP';
import Dashboard from './pages/Dashboard';
import RegisterBaby from './pages/RegisterBaby';
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

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <div className="app-shell">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/verify-otp" element={!user ? <VerifyOTP onAuth={checkAuth} /> : <Navigate to="/" />} />
          <Route path="/register-baby" element={user && !user.has_baby ? <RegisterBaby onUpdate={checkAuth} /> : <Navigate to="/" />} />
          <Route path="/" element={user ? (user.has_baby ? <Dashboard /> : <Navigate to="/register-baby" />) : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
