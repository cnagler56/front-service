import React from "react";
import styles from "./Home.module.css";

const WeatherConditions = () => {
  return (
    <section className={styles.farmSection}>
      <div className={styles.farmSectionHeader}>
        <span className={styles.sectionIcon}>🌦️</span>
        <h2>Weather &amp; Field Conditions</h2>
      </div>
      <div className={`${styles.farmSectionBody} ${styles.twoCol}`}>
        <div className={styles.farmColPlaceholder}>Image or widget</div>
        <div className={styles.farmColPlaceholder}>Image or widget</div>
      </div>
    </section>
  );
};

export default WeatherConditions;