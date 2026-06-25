import React from "react";
import Link from "next/link";
import styles from "./Home.module.css";

const WeatherConditions = () => {
  return (
    <section className={styles.farmSection}>
      <div className={styles.farmSectionHeader}>
        <h2>Weather &amp; Field Conditions</h2>
      </div>
      <div className={`${styles.farmSectionBody} ${styles.twoCol}`}>
        <div className={styles.farmColPlaceholder} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '2rem' }}>🌤️</span>
          <p style={{ margin: 0, fontSize: '.82rem', color: '#888', textAlign: 'center' }}>
            Get your local NWS forecast
          </p>
          <Link href="/weather" style={{ background: '#2c4a1e', color: '#f0f7e6', padding: '.4rem 1rem', borderRadius: 4, fontSize: '.8rem', textDecoration: 'none', fontWeight: 700 }}>
            View Forecast
          </Link>
        </div>
        <div className={styles.farmColPlaceholder} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '2rem' }}>🗺️</span>
          <p style={{ margin: 0, fontSize: '.82rem', color: '#888', textAlign: 'center' }}>
            Forecast shifts &amp; drought map
          </p>
          <Link href="/forecast-map" style={{ background: '#2c4a1e', color: '#f0f7e6', padding: '.4rem 1rem', borderRadius: 4, fontSize: '.8rem', textDecoration: 'none', fontWeight: 700 }}>
            Open Map
          </Link>
        </div>
      </div>
    </section>
  );
};

export default WeatherConditions;
