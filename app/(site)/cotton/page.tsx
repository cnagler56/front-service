'use client';

import CommodityDashboard from '@/src/components/commodity/CommodityDashboard';
import styles from '@/src/styles/farm.module.css';

export default function CottonPage() {
  return (
    <div className={styles.page}>
      <CommodityDashboard
        commodity="COTTON"
        commodityLabel="Cotton"
        pricesGroupName="Cotton"
        yieldUnit="lb/acre"
      />
    </div>
  );
}
