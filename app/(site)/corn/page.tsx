"use client";

import CommodityDashboard from "@/src/components/commodity/CommodityDashboard";
import styles from "@/src/styles/farm.module.css";

export default function CornPage() {
  return (
    <div className={styles.page}>
      <CommodityDashboard
        commodity="CORN"
        commodityLabel="Corn"
        pricesGroupName="Corn"
      />
    </div>
  );
}
