'use client';

import CpcOutlookPanel from './CpcOutlookPanel';
import OutlookTrendStrip from './OutlookTrendStrip';
import styles from '@/src/styles/farm.module.css';

/**
 * Weather → Extended Outlook: NOAA CPC's 6–10 day and 8–14 day temperature
 * and precipitation probability outlooks on one page — the two horizons
 * traders and agronomists check together.
 */
export default function OutlookPage() {
  return (
    <div className={styles.page}>
      <p style={{
        fontFamily: 'Lato, sans-serif', fontSize: '.9rem', color: '#555',
        lineHeight: 1.6, margin: '0 0 .25rem', maxWidth: 760,
      }}>
        Where the weather is <em>leaning</em> beyond this week&rsquo;s forecast: NOAA&rsquo;s
        official probability outlooks for the next two horizons. The 6–10 day maps cover
        roughly next week; the 8–14 day maps reach into the week after.
      </p>

      <OutlookTrendStrip />
      <CpcOutlookPanel range="6–10" prefix="610" />
      <CpcOutlookPanel range="8–14" prefix="814" />
    </div>
  );
}
