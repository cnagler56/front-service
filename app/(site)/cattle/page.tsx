'use client';

import LivestockDashboard from '@/src/components/commodity/LivestockDashboard';
import styles from '@/src/styles/farm.module.css';

export default function CattlePage() {
  return (
    <div className={styles.page}>
      <LivestockDashboard
        commodity="CATTLE"
        commodityLabel="Cattle"
        pricesGroupName="Live Cattle"
        defaultMonth="1"   // Jan 1 — annual Cattle Inventory
        inventoryDescription="Live + Feeder Cattle futures, CFTC positioning, monthly Cattle on Feed, and the NASS inventory snapshot."
        extraPricesGroupName="Feeder Cattle"
      />
    </div>
  );
}
