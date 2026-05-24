'use client'
import React from "react";
import styles from "./Home.module.css";
import useMarketData from "./useMarketData";

const MarketOverview = () => {
  const { data, loading, error } = useMarketData();

  return (
    <section className={styles.farmSection}>
      <div className={styles.farmSectionHeader}>
        <span className={styles.sectionIcon}>🌾</span>
        <h2>Market Overview</h2>
      </div>

      <div className={styles.farmSectionBody}>
        {loading && <p>Loading market trends...</p>}
        {error && <p className={styles.errorMessage}>Error: {error}</p>}
        
        {data && Array.isArray(data) && (
          <div className={styles.marketList}>
            {data.map((item, index) => (
              <div key={index} className={styles.marketItem}>
                <span className={styles.symbol}>{item.symbol}</span>
                <span className={styles.price}>${item.close.toLocaleString()}</span>
                <span 
                  className={styles.change} 
                  style={{ color: item.change >= 0 ? '#4caf50' : '#f44336' }}
                >
                  {item.change >= 0 ? '+' : ''}{item.change} ({item.changePercent}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default MarketOverview;