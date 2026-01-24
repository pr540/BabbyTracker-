import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Info, Calendar, Sparkles, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';
import Layout from '../components/Layout';

const Analysis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    try {
      const res = await api.get('/analysis');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div><p style={{ marginTop: '20px', color: '#6B7280' }}>Generating AI Insights...</p></div></Layout>;

  return (
    <Layout>
      <div style={{ padding: '32px 24px' }}>
        <h1 className="title" style={{ textAlign: 'left', fontSize: '1.75rem', fontWeight: '900', color: '#1F2937' }}>Growth & Rest</h1>
        <p className="subtitle" style={{ textAlign: 'left', marginBottom: '32px' }}>AI-driven behavioral analysis</p>

        {/* Dynamic Chart Card */}
        <div className="glass-card" style={{ padding: '28px', marginBottom: '32px', background: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: '#F3E8FF', borderRadius: '50%', opacity: 0.5 }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={18} color="#8B5CF6" />
              <h3 style={{ fontSize: '1rem', fontWeight: '800' }}>Sleep Quality</h3>
            </div>
            <div style={{ background: '#F3F4F6', padding: '6px 12px', borderRadius: '10px', fontSize: '0.7rem', color: '#6B7280', fontWeight: '700' }}>Past week</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '160px', gap: '10px', padding: '0 10px' }}>
            {data && data.sleep_history ? data.sleep_history.map((item, i) => (
              <div key={item.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  style={{ fontSize: '0.65rem', fontWeight: '900', color: '#8B5CF6' }}
                >
                  {item.hours}h
                </motion.div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(item.hours / 15) * 120}px` }}
                  transition={{ duration: 1, ease: 'backOut', delay: i * 0.1 }}
                  style={{
                    width: '100%',
                    background: i === 6 ? 'linear-gradient(to top, #7C3AED, #A78BFA)' : 'linear-gradient(to top, #E5E7EB, #F3F4F6)',
                    borderRadius: '10px',
                    boxShadow: i === 6 ? '0 10px 20px rgba(139, 92, 246, 0.2)' : 'none'
                  }}
                />
                <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: '700' }}>{item.date}</div>
              </div>
            )) : null}
          </div>
        </div>

        {/* Actionable Trend Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
          <motion.div whileHover={{ translateY: -5 }} className="glass-card" style={{ padding: '24px', background: '#F0FDF4', border: '1px solid #DCFCE7' }}>
            <div style={{ background: 'white', padding: '8px', borderRadius: '12px', width: 'fit-content', marginBottom: '16px' }}>
              <TrendingUp size={20} color="#10B981" />
            </div>
            <p style={{ fontSize: '0.75rem', color: '#166534', fontWeight: '700' }}>Continuity</p>
            <h4 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#14532D', marginTop: '4px' }}>{data?.completion_rate}%</h4>
          </motion.div>

          <motion.div whileHover={{ translateY: -5 }} className="glass-card" style={{ padding: '24px', background: '#FEF2F2', border: '1px solid #FEE2E2' }}>
            <div style={{ background: 'white', padding: '8px', borderRadius: '12px', width: 'fit-content', marginBottom: '16px' }}>
              <TrendingDown size={20} color="#EF4444" />
            </div>
            <p style={{ fontSize: '0.75rem', color: '#991B1B', fontWeight: '700' }}>Disturbance</p>
            <h4 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#7F1D1D', marginTop: '4px' }}>{data?.total_cries}</h4>
          </motion.div>
        </div>

        {/* AI Behavioral Insights */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', gap: '20px', background: 'linear-gradient(135deg, white 0%, #F5F3FF 100%)', border: '1px solid #DDD6FE' }}>
          <div style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', padding: '12px', borderRadius: '16px', height: 'fit-content', boxShadow: '0 8px 16px rgba(139, 92, 246, 0.3)' }}>
            <Sparkles size={20} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#4C1D95' }}>AI Behavioral Insight</h4>
            <p style={{ fontSize: '0.85rem', color: '#6D28D9', marginTop: '6px', lineHeight: '1.6' }}>
              Baby's circadian rhythm is stabilizing. Deep REM sleep is up by 15% this week. We recommend maintaining the 7 PM bedtime for optimal cognitive development.
            </p>
          </div>
        </div>

        {/* Routine Comparison */}
        <div style={{ marginTop: '40px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1F2937', marginBottom: '20px' }}>Routine Accuracy</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {['Feeding', 'Napping', 'Exercise'].map((item, idx) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '80px', fontSize: '0.8rem', fontWeight: '700', color: '#6B7280' }}>{item}</div>
                <div style={{ flex: 1, height: '8px', background: '#F3F4F6', borderRadius: '10px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${85 - (idx * 15)}%` }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    style={{ height: '100%', background: 'linear-gradient(to right, #8B5CF6, #C084FC)', borderRadius: '10px' }}
                  />
                </div>
                <div style={{ width: '40px', fontSize: '0.75rem', fontWeight: '800', color: '#1F2937', textAlign: 'right' }}>{85 - (idx * 15)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analysis;
