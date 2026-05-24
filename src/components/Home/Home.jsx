import React from "react";
import styles from "./Home.module.css";
import MarketOverview from "./MarketOverview";
import LatestNews from "./LatestNews";
import WeatherConditions from "./WeatherConditions";

const Home = () => {
  return (
    <main className={styles.farmPageBody}>
      <MarketOverview />
      <LatestNews />
      <WeatherConditions />
    </main>
  );
};

export default Home;