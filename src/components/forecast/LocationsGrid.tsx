'use client';

import { ForecastLocation } from '@/src/lib/api';
import ForecastDiffCard from './ForecastDiffCard';
import styles from './forecastChange.module.css';

interface Props {
  locations: ForecastLocation[];
  onEdit:   (loc: ForecastLocation) => void;
  onDelete: (loc: ForecastLocation) => void;
}

/** Two-column grid of forecast-diff cards used on /forecast-change. */
export default function LocationsGrid({ locations, onEdit, onDelete }: Props) {
  return (
    <div className={styles.locationsGrid}>
      {locations.map(loc => (
        <ForecastDiffCard
          key={loc.id}
          location={loc}
          onEdit={() => onEdit(loc)}
          onDelete={() => onDelete(loc)}
        />
      ))}
    </div>
  );
}
