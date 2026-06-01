import React from "react";
import styles from "./Home.module.css";
import CommodityPrices from "./CommodityPrices";
import LatestNews from "./LatestNews";
import WeatherConditions from "./WeatherConditions";

const Home = () => {
  return (
    <main className={styles.farmPageBody}>
      <CommodityPrices />
      <LatestNews />
      <WeatherConditions />
    </main>
  );
};

export default Home;
