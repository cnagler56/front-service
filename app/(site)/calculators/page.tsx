'use client';

import SeedPopulationCalc from '@/src/components/calculators/SeedPopulationCalc';
import SprayerGpaCalc from '@/src/components/calculators/SprayerGpaCalc';
import GrainShrinkCalc from '@/src/components/calculators/GrainShrinkCalc';
import CashRentCalc from '@/src/components/calculators/CashRentCalc';
import LoanCalc from '@/src/components/calculators/LoanCalc';
import styles from '@/src/styles/farm.module.css';

export default function CalculatorsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>🧮</span>
          <h2>Farm Calculators</h2>
        </div>
        <div className={styles.sectionBody}>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.85rem', color: '#666', margin: 0 }}>
            Quick math you reach for through the season — seed populations, sprayer rates,
            grain shrink, breakeven rent, and loan payments. All results update as you type.
          </p>
        </div>
      </div>

      <SeedPopulationCalc />
      <SprayerGpaCalc />
      <GrainShrinkCalc />
      <CashRentCalc />
      <LoanCalc />
    </div>
  );
}
