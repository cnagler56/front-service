'use client';

import LivestockDashboard from '@/src/components/commodity/LivestockDashboard';
import styles from '@/src/styles/farm.module.css';

export default function CattlePage() {
  return (
    <div className={styles.page}>
      <LivestockDashboard
        commodity="CATTLE"
        commodityLabel="Cattle"
        commodityIcon="🐄"
        pricesGroupName="Live Cattle"
        defaultMonth="1"   // Jan 1 — annual Cattle Inventory
        inventoryDescription="Live Cattle futures, NASS Cattle Inventory snapshot, and top producing states. Drill into the full report from the link above."
      />
    </div>
  );
}
