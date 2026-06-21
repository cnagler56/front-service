'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/src/lib/api';
import styles from './Home.module.css';

/**
 * Row of futures price cards: Corn, Soybeans, Wheat, Live Cattle, Lean Hogs.
 * Each card shows the front contract big, with the next 4 deferred contracts
 * in a compact table below.
 * Auto-refreshes every 5 minutes (server caches for 5 min too).
 */
const CommodityPrices = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = () => {
    api.getPrices()
      .then(g => {
        setGroups(g);
        setUpdatedAt(new Date());
        setError('');
      })
      .catch(() => setError('Could not load prices. Is the server running?'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className={styles.farmSection}>
      <div className={styles.farmSectionHeader}>
        <span className={styles.sectionIcon}>📈</span>
        <h2>Today's Commodity Prices</h2>
        {updatedAt && (
          <span style={{ marginLeft: 'auto', color: '#a8cc78', fontSize: '.7rem', letterSpacing: '.05em' }}>
            UPDATED {updatedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
        )}
      </div>
      <div
        className={styles.farmSectionBody}
        style={{ display: 'block', padding: '1.25rem 1.5rem' }}
      >
        {loading ? (
          <p style={{ color: '#aaa', fontStyle: 'italic', textAlign: 'center', width: '100%' }}>
            Loading prices…
          </p>
        ) : error ? (
          <p style={{ color: '#c2410c', textAlign: 'center', width: '100%', fontSize: '.85rem' }}>{error}</p>
        ) : (
          <div className={styles.priceGrid}>
            {groups.map(g => (
              <CommodityCard key={g.name} group={g} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

/** A single commodity card — big front-month price + deferred contracts table. */
function CommodityCard({ group }) {
  const [front, ...deferred] = group.contracts ?? [];
  if (!front) {
    return (
      <div className={styles.priceCard}>
        <div className={styles.priceCardHead}>
          <span className={styles.priceName}>{group.name}</span>
          <span className={styles.priceUnit}>{group.unit}</span>
        </div>
        <div className={styles.priceError}>—</div>
      </div>
    );
  }
  const up = (front.change ?? 0) > 0;
  const down = (front.change ?? 0) < 0;
  const arrow = up ? '▲' : down ? '▼' : '—';
  const tone = up ? '#2c7a1e' : down ? '#b91c1c' : '#888';

  return (
    <div className={styles.priceCard}>
      <div className={styles.priceCardHead}>
        <span className={styles.priceName}>{group.name}</span>
        <span className={styles.priceUnit}>{group.unit}</span>
      </div>

      {/* Front contract — the headline price */}
      <div className={styles.priceExp}>{front.expiration} (front)</div>
      {front.error ? (
        <div className={styles.priceError}>—</div>
      ) : (
        <>
          <div className={styles.priceValue}>
            {front.last != null ? front.last.toFixed(2) : '—'}
          </div>
          <div className={styles.priceChange} style={{ color: tone }}>
            <span>{arrow}</span>
            <span>
              {front.change != null ? formatSigned(front.change) : '—'}
              {front.changePercent != null && (
                <span style={{ marginLeft: '.4rem', opacity: .85 }}>
                  ({formatSigned(front.changePercent)}%)
                </span>
              )}
            </span>
          </div>
          {front.asOf && (
            <div style={{ fontSize: '.66rem', color: '#9aa886', marginTop: '.25rem', fontFamily: 'Lato, sans-serif' }}>
              {fmtAsOf(front.asOf)}
            </div>
          )}
        </>
      )}

      {/* Deferred contracts */}
      {deferred.length > 0 && (
        <table className={styles.contractsTable}>
          <thead>
            <tr>
              <th>Contract</th>
              <th>Last</th>
              <th>Chg</th>
            </tr>
          </thead>
          <tbody>
            {deferred.map(c => {
              const cUp   = (c.change ?? 0) > 0;
              const cDown = (c.change ?? 0) < 0;
              const cTone = cUp ? '#2c7a1e' : cDown ? '#b91c1c' : '#888';
              return (
                <tr key={c.symbol}>
                  <td>{c.expiration}</td>
                  <td>
                    {c.error || c.last == null
                      ? '—'
                      : c.last.toFixed(2)}
                  </td>
                  <td style={{ color: cTone, fontWeight: 600 }}>
                    {c.change == null ? '—' : formatSigned(c.change)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

/** Unix seconds → "as of Jun 18, 1:20 PM" — the quote's own timestamp (Yahoo). */
function fmtAsOf(sec) {
  if (!sec) return '';
  const d = new Date(sec * 1000);
  if (isNaN(d.getTime())) return '';
  return 'as of ' + d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatSigned(n) {
  // toFixed(2) intentionally — no thousands separator for futures quotes.
  // Day changes are small enough that this never matters numerically, but
  // keeps formatting consistent with the price values above.
  const v = Math.abs(n).toFixed(2);
  return (n > 0 ? '+' : n < 0 ? '−' : '') + v;
}

export default CommodityPrices;
