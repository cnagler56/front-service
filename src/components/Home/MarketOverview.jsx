'use client';
import React, { useEffect, useState } from "react";
import styles from "./Home.module.css";

const MarketOverview = () => {
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8081/cornestimates')
      .then(r => r.json())
      .then(data => setEstimates(data.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className={styles.farmSection}>
      <div className={styles.farmSectionHeader}>
        <span className={styles.sectionIcon}>🌾</span>
        <h2>Community Corn Yield Estimates</h2>
      </div>
      <div className={styles.farmSectionBody} style={{ display: 'block', padding: '1.25rem 1.5rem' }}>
        {loading ? (
          <p style={{ color: '#aaa', fontStyle: 'italic', textAlign: 'center', width: '100%' }}>Loading estimates…</p>
        ) : estimates.length === 0 ? (
          <p style={{ color: '#aaa', textAlign: 'center', width: '100%', fontSize: '.85rem' }}>
            No estimates yet — <a href="/corn" style={{ color: '#3d6b2a' }}>be the first to submit one</a>.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' }}>
            <thead>
              <tr>
                {['Name', 'State', 'Estimate (bu/ac)', 'Interest'].map(h => (
                  <th key={h} style={{ background: '#2c4a1e', color: '#f0f7e6', padding: '.45rem .9rem', textAlign: 'left', fontSize: '.75rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {estimates.map((e, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '.45rem .9rem', color: '#444' }}>{e.name}</td>
                  <td style={{ padding: '.45rem .9rem', color: '#444' }}>{e.state}</td>
                  <td style={{ padding: '.45rem .9rem', color: '#444', fontWeight: 600 }}>{e.yiel}</td>
                  <td style={{ padding: '.45rem .9rem', color: '#888' }}>{e.interest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default MarketOverview;
