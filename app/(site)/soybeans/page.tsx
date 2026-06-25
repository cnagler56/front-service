'use client';

import CommodityDashboard from '@/src/components/commodity/CommodityDashboard';
import SoybeanCrushPanel from '@/src/components/commodity/SoybeanCrushPanel';
import styles from '@/src/styles/farm.module.css';

export default function SoybeansPage() {
  return (
    <div className={styles.page}>
      <CommodityDashboard
        commodity="SOYBEANS"
        commodityLabel="Soybeans"
        pricesGroupName="Soybeans"
      />
      <SoybeanCrushPanel />
    </div>
  );
}
