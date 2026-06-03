'use client';

import { ListingType, ListingCategory, LISTING_CATEGORIES } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

export type TypeFilter = 'ALL' | ListingType;
export type CategoryFilter = 'ALL' | ListingCategory;

interface Props {
  typeFilter: TypeFilter;
  categoryFilter: CategoryFilter;
  onTypeChange: (t: TypeFilter) => void;
  onCategoryChange: (c: CategoryFilter) => void;
}

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'ALL',  label: 'All' },
  { value: 'BUY',  label: 'Buying' },
  { value: 'SELL', label: 'Selling' },
];

/** Two pill rows: BUY/SELL filter and category filter. */
export default function ListingFilters({
  typeFilter, categoryFilter, onTypeChange, onCategoryChange,
}: Props) {
  return (
    <div className={styles.filterPills}>
      <div className={styles.filterGroup}>
        {TYPE_OPTIONS.map(t => (
          <button
            key={t.value}
            className={`${styles.filterPill} ${typeFilter === t.value ? styles.filterPillActive : ''}`}
            onClick={() => onTypeChange(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className={styles.filterGroup}>
        <button
          className={`${styles.filterPill} ${categoryFilter === 'ALL' ? styles.filterPillActive : ''}`}
          onClick={() => onCategoryChange('ALL')}
        >
          All
        </button>
        {LISTING_CATEGORIES.map(c => (
          <button
            key={c.value}
            className={`${styles.filterPill} ${categoryFilter === c.value ? styles.filterPillActive : ''}`}
            onClick={() => onCategoryChange(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
