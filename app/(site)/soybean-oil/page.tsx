'use client';

import CommodityDashboard from '@/src/components/commodity/CommodityDashboard';
import styles from '@/src/styles/farm.module.css';

export default function SoybeanOilPage() {
  return (
    <div className={styles.page}>
      <CommodityDashboard
        commodity="SOYBEAN_OIL"
        commodityLabel="Soybean Oil"
        commodityIcon="🛢️"
        pricesGroupName="Soybean Oil"
        crushProduct
      />
    </div>
  );
}
