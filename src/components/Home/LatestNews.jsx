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
const LatestNews = () => {
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
    <section className={styles.farmSection}>
      <div className={styles.farmSectionHeader}>
        <span className={styles.sectionIcon}>📰</span>
        <h2>Latest News</h2>
      </div>
      <div className={`${styles.farmSectionBody} ${styles.farmSectionBodyWarm}`} style={{ display: 'block', padding: '0.5rem 0' }}>
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
      <span style={{ fontSize: '1.25rem', lineHeight: 1.2, flex: '0 0 auto' }}>{item.icon || '•'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '.9rem', color: '#2c4a1e', lineHeight: 1.3 }}>
          {item.headline}
        </div>
        {item.detail && (
          <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '.78rem', color: '#7a7060', marginTop: '.15rem' }}>
            {item.detail}
          </div>
        )}
      </div>
      {item.eventDate && (
        <span style={{
          flex: '0 0 auto', fontFamily: 'Lato, sans-serif', fontSize: '.68rem',
          color: '#a09684', whiteSpace: 'nowrap', marginTop: '.15rem',
        }}>
          {item.eventDate}
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
