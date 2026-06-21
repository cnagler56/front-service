'use client';

import { ForecastLocation } from '@/src/lib/api';
import ForecastDiffCard from './ForecastDiffCard';
import styles from './forecastChange.module.css';

interface Props {
  locations: ForecastLocation[];
  // Omitted for non-admins → the cards render without edit/delete controls.
  onEdit?:   (loc: ForecastLocation) => void;
  onDelete?: (loc: ForecastLocation) => void;
}

/** Two-column grid of forecast-diff cards used on /forecast-change. */
export default function LocationsGrid({ locations, onEdit, onDelete }: Props) {
  return (
    <div className={styles.locationsGrid}>
      {locations.map(loc => (
        <ForecastDiffCard
          key={loc.id}
          location={loc}
          onEdit={onEdit ? () => onEdit(loc) : undefined}
          onDelete={onDelete ? () => onDelete(loc) : undefined}
        />
      ))}
    </div>
  );
}
