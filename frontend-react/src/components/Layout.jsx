import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ClipboardList, BarChart3, Settings, Moon } from 'lucide-react';

const Layout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', paddingBottom: '100px', background: '#F9FAFB' }}>
      <main style={{ maxWidth: '480px', margin: '0 auto', background: 'white', minHeight: '100vh', boxShadow: '0 0 20px rgba(0,0,0,0.02)' }}>
        {children}
      </main>

      {/* Navigation Bar */}
      <div className="nav-bar" style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '16px 8px',
        borderTop: '1px solid #F3F4F6',
        zIndex: 100,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
        borderRadius: '24px 24px 0 0'
      }}>
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
          <Home size={22} />
          <span>Home</span>
        </NavLink>

        <NavLink to="/tasks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
          <ClipboardList size={22} />
          <span>Baby Tasks</span>
        </NavLink>

        <NavLink to="/monitor" style={{ textDecoration: 'none', marginTop: '-36px' }}>
          <div style={{ background: 'var(--primary)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '5px solid white', boxShadow: '0 8px 16px rgba(139, 92, 246, 0.4)', cursor: 'pointer' }}>
            <Moon size={28} />
          </div>
        </NavLink>

        <NavLink to="/analysis" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
          <BarChart3 size={22} />
          <span>Analysis</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
          <Settings size={22} />
          <span>Profile</span>
        </NavLink>
      </div>

      <style>{`
        .nav-item {
          color: #9CA3AF;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-item.active {
          color: #8B5CF6;
          transform: translateY(-2px);
        }
        .nav-item:active {
          transform: scale(0.9);
        }
      `}</style>
    </div>
  );
};

export default Layout;
