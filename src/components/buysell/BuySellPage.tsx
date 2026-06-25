'use client';

import styles from '@/src/styles/farm.module.css';
import ListingFilters from './ListingFilters';

/**
 * Buy / Sell isn't live yet. We render the page chrome (header + filters) in a
 * dimmed, non-interactive state behind a "Coming Soon" banner so visitors can
 * see what's planned without being able to use it. No data is fetched.
 */
export default function BuySellPage() {
  return (
    <div className={styles.page}>
      <div className={styles.section} style={{ position: 'relative', overflow: 'hidden', minHeight: 360 }}>
        {/* Disabled preview — non-interactive and dimmed */}
        <div aria-hidden style={{ pointerEvents: 'none', userSelect: 'none', opacity: 0.4, filter: 'blur(1.5px)' }}>
          <div className={styles.sectionHeadRow}>
            <div className={styles.titleGroup}>
              
              <h2>Buy / Sell Listings</h2>
            </div>
            <button className={styles.headerBtn} disabled>+ Add Listing</button>
          </div>

          <div className={styles.sectionBody}>
            <ListingFilters
              typeFilter="ALL"
              categoryFilter="ALL"
              onTypeChange={() => {}}
              onCategoryChange={() => {}}
            />
            <p className={styles.empty}>
              Equipment, grain, livestock &amp; land listings will appear here.
            </p>
          </div>
        </div>

        {/* Coming Soon banner across the middle */}
        <div style={{
          position: 'absolute', top: '50%', left: 0, right: 0, transform: 'translateY(-50%)',
          background: 'rgba(26,46,15,0.94)', color: '#f0f7e6', textAlign: 'center',
          padding: '1.4rem 1rem', boxShadow: '0 6px 28px rgba(0,0,0,.35)',
        }}>
          <div style={{
            fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.7rem',
            fontWeight: 800, letterSpacing: '.06em',
          }}>
            🚧 Coming Soon
          </div>
          <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '.9rem', color: '#a8cc78', marginTop: '.35rem' }}>
            Buy / Sell listings are on the way — check back soon.
          </div>
        </div>
      </div>
    </div>
  );
}
