'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, Listing } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';
import ListingCard from './ListingCard';
import ListingFilters, { TypeFilter, CategoryFilter } from './ListingFilters';
import AddListingModal from './AddListingModal';

/**
 * Top-level orchestrator for the /buysell route — owns the listings state,
 * the active filters, and whether the Add Listing modal is open. Delegates
 * everything visible to focused child components.
 */
export default function BuySellPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [catFilter,  setCatFilter]  = useState<CategoryFilter>('ALL');

  const [modalOpen, setModalOpen] = useState(false);

  const refresh = useCallback(
    (t: TypeFilter = typeFilter, c: CategoryFilter = catFilter) => {
      setLoading(true);
      api.getListings(t, c)
        .then(setListings)
        .catch(() => setError('Failed to load listings. Is the server running?'))
        .finally(() => setLoading(false));
    },
    [typeFilter, catFilter],
  );

  useEffect(() => { refresh(typeFilter, catFilter); }, [typeFilter, catFilter, refresh]);

  return (
    <div className={styles.page}>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.section}>
        <div className={styles.sectionHeadRow}>
          <div className={styles.titleGroup}>
            <span>🛒</span>
            <h2>Buy / Sell Listings</h2>
          </div>
          <button className={styles.headerBtn} onClick={() => setModalOpen(true)}>
            + Add Listing
          </button>
        </div>

        <div className={styles.sectionBody}>
          <ListingFilters
            typeFilter={typeFilter}
            categoryFilter={catFilter}
            onTypeChange={setTypeFilter}
            onCategoryChange={setCatFilter}
          />

          {loading ? (
            <p className={styles.loading}>Loading…</p>
          ) : listings.length === 0 ? (
            <p className={styles.empty}>
              No listings yet — click <strong>+ Add Listing</strong> to post the first one.
            </p>
          ) : (
            <div className={styles.listingGrid}>
              {listings.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <AddListingModal
          onClose={() => setModalOpen(false)}
          onCreated={() => { setModalOpen(false); refresh(); }}
        />
      )}
    </div>
  );
}
