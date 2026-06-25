'use client';

import CommodityDashboard from '@/src/components/commodity/CommodityDashboard';
import SoyOilBiofuelPanel from '@/src/components/energy/SoyOilBiofuelPanel';
import styles from '@/src/styles/farm.module.css';

export default function SoybeanOilPage() {
  return (
    <div className={styles.page}>
      <CommodityDashboard
        commodity="SOYBEAN_OIL"
        commodityLabel="Soybean Oil"
        pricesGroupName="Soybean Oil"
        crushProduct
      />
      <SoyOilBiofuelPanel />
    </div>
  );
}
