'use client';

import CommodityDashboard from '@/src/components/commodity/CommodityDashboard';
import styles from '@/src/styles/farm.module.css';

export default function WheatPage() {
  return (
    <div className={styles.page}>
      <CommodityDashboard
        commodity="WHEAT"
        commodityLabel="Wheat"
        pricesGroupName="Wheat"
      />
    </div>
  );
}
