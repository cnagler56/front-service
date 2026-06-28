'use client';

import Link from 'next/link';
import SupplyDemandBox from '@/src/components/commodity/SupplyDemandBox';
import ConabPanel from './ConabPanel';
import SouthAmericaMap from './SouthAmericaMap';
import CropCalendarPanel from './CropCalendarPanel';
import styles from '@/src/styles/farm.module.css';

interface Props {
  commodity: string;            // WASDE key: "CORN" / "SOYBEANS"
  commodityLabel: string;       // "Corn" / "Soybeans"
  regions: { key: string; label: string }[];
}

/** Quick-switch list of South America crops. */
const CROPS = [
  { code: 'CORN', label: 'Corn', href: '/south-america/corn' },
  { code: 'SOYBEANS', label: 'Soybeans', href: '/south-america/soybeans' },
];

/**
 * South America view for a crop — the USDA WASDE balance sheet for the major
 * SA producers (Brazil, Argentina, +Paraguay for soybeans), reusing the same
 * Supply & Demand panel as the U.S. crop pages but toggled to those countries.
 */
export default function SouthAmericaPage({ commodity, commodityLabel, regions }: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.section} style={{ marginBottom: '1rem' }}>
        <div className={styles.sectionHead}>
          <h2>South America {commodityLabel}</h2>
        </div>
        <div className={styles.sectionBody}>
          {/* Quick switch between South America crops without going back to the menu. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '.85rem' }}>
            {CROPS.map(c => {
              const active = c.code === commodity.toUpperCase();
              return (
                <Link
                  key={c.code}
                  href={c.href}
                  style={{
                    fontFamily: 'Lato, sans-serif', fontSize: '.78rem', fontWeight: 700, textDecoration: 'none',
                    padding: '.3rem .85rem', borderRadius: 14,
                    border: '1px solid ' + (active ? '#3d6b2a' : '#cdd6bd'),
                    background: active ? '#3d6b2a' : '#fff',
                    color: active ? '#f0f7e6' : '#3d6b2a',
                    cursor: active ? 'default' : 'pointer',
                  }}
                  aria-current={active ? 'page' : undefined}
                >
                  {c.label}
                </Link>
              );
            })}
          </div>

          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.85rem', color: '#666', margin: 0 }}>
            USDA WASDE supply &amp; demand for the major South American {commodityLabel.toLowerCase()} producers —
            the other half of the global balance. Figures are in metric tons; switch countries above the table.
          </p>
        </div>
      </div>

      <SupplyDemandBox commodity={commodity} commodityLabel={commodityLabel} regions={regions} />

      {/* CONAB Brazil production detail (corn safrinha split + top states). */}
      <ConabPanel commodity={commodity} commodityLabel={commodityLabel} />

      {/* Production map: Brazil by state + Argentina/Paraguay national. */}
      <SouthAmericaMap commodity={commodity} commodityLabel={commodityLabel} />

      {/* Planting / harvest calendar for the SA crops (this crop's rows emphasized). */}
      <CropCalendarPanel commodity={commodity} />
    </div>
  );
}
