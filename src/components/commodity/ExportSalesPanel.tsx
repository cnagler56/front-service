'use client';

import { useEffect, useState } from 'react';
import { api, ExportSalesData } from '@/src/lib/api';
import { StatCard } from '@/src/components/energy/EnergyCharts';
import styles from './commodityDashboard.module.css';

function fmtDate(p?: string): string {
  if (!p) return '';
  const d = new Date(p);
  return isNaN(d.getTime()) ? p : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Volume formatter: metric tons → MMT / k MT; cotton in running bales. */
function fmtVol(v: number | null | undefined, unit?: string): string {
  if (v == null) return '—';
  if (unit !== 'MT') return `${Math.round(v).toLocaleString()}`;
  const abs = Math.abs(v);
  if (abs >= 1e6) return `${(v / 1e6).toFixed(2)} MMT`;
  return `${Math.round(v / 1e3).toLocaleString()} k MT`;
}

interface Props { commodity: string; commodityLabel: string; }

/** USDA FAS weekly export sales for a commodity — self-hides if not tracked. */
export default function ExportSalesPanel({ commodity, commodityLabel }: Props) {
  const [data, setData] = useState<ExportSalesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.getExportSales(commodity)
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => { /* self-hide */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [commodity]);

  if (loading || !data || !data.weekEnding) return null;
  const unit = data.unit;
  const dests = data.topDestinations ?? [];

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <h2>Export Sales</h2>
        <span style={{ marginLeft: 'auto', color: '#a8cc78', fontSize: '.75rem', fontFamily: 'Lato, sans-serif' }}>
          Week of {fmtDate(data.weekEnding)}
        </span>
      </div>
      <div style={{ padding: '.7rem 1rem 1rem', fontFamily: 'Lato, sans-serif' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.7rem', marginBottom: dests.length ? '1rem' : 0 }}>
          <StatCard label="Net New Sales" value={fmtVol(data.netSales, unit)} accent="#3d6b2a" />
          <StatCard label="Shipments" value={fmtVol(data.shipments, unit)} accent="#a16207" />
          <StatCard label="Total Commitments" value={fmtVol(data.totalCommitment, unit)} accent="#1a2e0f" />
          {data.nextMYNetSales != null && data.nextMYNetSales !== 0 && (
            <StatCard label="New-Crop Sales" value={fmtVol(data.nextMYNetSales, unit)} accent="#2563eb" />
          )}
        </div>

        {dests.length > 0 && (
          <div>
            <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: '#6a7a55', marginBottom: '.4rem' }}>
              Top destinations this week
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
              {dests.map(d => (
                <span key={d.country} style={{
                  fontSize: '.78rem', color: '#33402a', background: '#f3f7ea',
                  border: '1px solid #dde5cd', borderRadius: 14, padding: '.25rem .7rem',
                }}>
                  {d.country} <strong>{fmtVol(d.netSales, unit)}</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        <p style={{ margin: '.8rem 0 0', fontSize: '.7rem', color: '#999' }}>
          {data.source ?? 'USDA FAS'} · net new sales for {commodityLabel.toLowerCase()}, current marketing year.
        </p>
      </div>
    </div>
  );
}
