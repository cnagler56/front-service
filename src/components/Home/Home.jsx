'use client';
import React, { useLayoutEffect, useRef, useState } from "react";
import styles from "./Home.module.css";
import CommodityPrices from "./CommodityPrices";
import LatestNews from "./LatestNews";
import UsdaReportCalendar from "./UsdaReportCalendar";
import WeatherConditions from "./WeatherConditions";

const Home = () => {
  // Match Latest News to the Upcoming Reports panel height (it scrolls if taller).
  const reportRef = useRef(null);
  const [reportH, setReportH] = useState(null);

  useLayoutEffect(() => {
    const el = reportRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => setReportH(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <main className={styles.farmPageBody}>
      <CommodityPrices />
      <div className={styles.sideBySide}>
        <LatestNews maxHeight={reportH} />
        <div ref={reportRef}>
          <UsdaReportCalendar />
        </div>
      </div>
      <WeatherConditions />
    </main>
  );
};

export default Home;
