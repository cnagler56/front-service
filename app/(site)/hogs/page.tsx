'use client';

import LivestockDashboard from '@/src/components/commodity/LivestockDashboard';
import styles from '@/src/styles/farm.module.css';

export default function HogsPage() {
  return (
    <div className={styles.page}>
      <LivestockDashboard
        commodity="HOGS"
        commodityLabel="Hogs"
        commodityIcon="🐖"
        pricesGroupName="Lean Hogs"
        defaultMonth="12"   // Dec 1 — Q4 Hogs & Pigs is the most recent snapshot for prior year
        inventoryDescription="Lean Hogs futures, CFTC positioning, the quarterly Hogs & Pigs report (breeding vs. market), and the NASS inventory snapshot."
      />
    </div>
  );
}
