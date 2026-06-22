'use client';

import CommodityDashboard from '@/src/components/commodity/CommodityDashboard';
import styles from '@/src/styles/farm.module.css';

export default function SoybeanMealPage() {
  return (
    <div className={styles.page}>
      <CommodityDashboard
        commodity="SOYBEAN_MEAL"
        commodityLabel="Soybean Meal"
        commodityIcon="🥣"
        pricesGroupName="Soybean Meal"
        crushProduct
      />
    </div>
  );
}
