'use client';
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/src/lib/api";
import styles from "./Home.module.css";

/**
 * Auto-generated "Latest News" — headlines distilled from the data we already
 * pull (WASDE, weekly ethanol, ENSO, notable price moves). Each item rolls off
 * ~3 days after it appears (the server applies the window). Newest first.
 */
const LatestNews = ({ maxHeight }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.getNews()
      .then(d => { if (!cancelled) setItems(Array.isArray(d) ? d : []); })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section
      className={styles.farmSection}
      style={maxHeight ? { maxHeight, display: 'flex', flexDirection: 'column' } : undefined}
    >
      <div className={styles.farmSectionHeader}>
        <h2>Latest News</h2>
      </div>
      <div
        className={`${styles.farmSectionBody} ${styles.farmSectionBodyWarm}`}
        style={{ display: 'block', padding: '0.5rem 0', flex: 1, minHeight: 0, overflowY: 'auto' }}
      >
        {loading ? (
          <p style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', padding: '1.5rem' }}>
            Loading the latest…
          </p>
        ) : items.length === 0 ? (
          <div className={styles.farmPlaceholder}>
            <span className={styles.farmPlaceholderIcon}>🗞️</span>
            <p>No fresh updates in the last few days — check back after the next USDA/EIA release.</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {items.map((n, i) => (
              <NewsRow key={i} item={n} last={i === items.length - 1} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

/** ISO timestamp → "Jun 23" (the date the item was released / first appeared). */
function fmtDay(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function NewsRow({ item, last }) {
  const inner = (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '.7rem',
        padding: '.7rem 1.25rem',
        borderBottom: last ? 'none' : '1px solid #ece6d8',
        transition: 'background .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(143,188,69,0.10)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '.9rem', color: '#2c4a1e', lineHeight: 1.3 }}>
          {item.headline}
        </div>
        {(item.detail || item.eventDate) && (
          <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '.78rem', color: '#7a7060', marginTop: '.15rem' }}>
            {item.detail}
            {item.detail && item.eventDate ? ' · ' : ''}
            {item.eventDate && <span style={{ color: '#a09684' }}>for {item.eventDate}</span>}
          </div>
        )}
      </div>
      {item.createdAt && (
        <span style={{
          flex: '0 0 auto', fontFamily: 'Lato, sans-serif', fontSize: '.68rem', fontWeight: 700,
          color: '#a09684', whiteSpace: 'nowrap', marginTop: '.15rem',
        }}>
          {fmtDay(item.createdAt)}
        </span>
      )}
    </div>
  );

  return (
    <li>
      {item.link ? (
        <Link href={item.link} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          {inner}
        </Link>
      ) : inner}
    </li>
  );
}

export default LatestNews;
