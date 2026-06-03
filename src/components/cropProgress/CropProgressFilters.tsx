'use client';

import styles from '@/src/styles/farm.module.css';

const GRAINS = [
  { value: 'CORN',     label: 'Corn'     },
  { value: 'SOYBEANS', label: 'Soybeans' },
  { value: 'WHEAT',    label: 'Wheat'    },
  { value: 'COTTON',   label: 'Cotton'   },
  { value: 'SORGHUM',  label: 'Sorghum'  },
  { value: 'RICE',     label: 'Rice'     },
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

interface Props {
  grain: string;
  year: number;
  loading: boolean;
  onGrainChange: (g: string) => void;
  onYearChange: (y: number) => void;
  onLoad: () => void;
}

/** Commodity + year selector with the Load Progress button. */
export default function CropProgressFilters({
  grain, year, loading, onGrainChange, onYearChange, onLoad,
}: Props) {
  return (
    <div className={styles.filters}>
      <div className={styles.formRow}>
        <label>Commodity</label>
        <select value={grain} onChange={e => onGrainChange(e.target.value)}>
          {GRAINS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
      </div>
      <div className={styles.formRow}>
        <label>Year</label>
        <select value={year} onChange={e => onYearChange(Number(e.target.value))}>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <button className={styles.btn} onClick={onLoad} disabled={loading}>
        {loading ? 'Loading…' : 'Load Progress'}
      </button>
    </div>
  );
}

/** Friendly label lookup, exported so the page can show it in messages. */
export function grainLabel(value: string): string {
  return GRAINS.find(g => g.value === value)?.label ?? value;
}
