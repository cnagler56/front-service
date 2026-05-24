import React from "react";
import styles from "./Home.module.css";

const LatestNews = () => {
  return (
    <section className={styles.farmSection}>
      <div className={styles.farmSectionHeader}>
        <span className={styles.sectionIcon}>📰</span>
        <h2>Latest News</h2>
      </div>
      <div className={`${styles.farmSectionBody} ${styles.farmSectionBodyWarm}`}>
        <div className={styles.farmPlaceholder}>
          <span className={styles.farmPlaceholderIcon}>🗞️</span>
          <p>News articles, announcements, or text content goes here</p>
        </div>
      </div>
    </section>
  );
};

export default LatestNews;