import Link from 'next/link';
import styles from '@/src/styles/farm.module.css';
import { CALCULATORS } from './calculatorList';

/**
 * /calculators hub — a short intro and a card linking to each calculator's
 * own page. Adding a calculator: build the component, give it a page under
 * app/(site)/calculators/, and add it to calculatorList.ts and src/lib/seo.ts.
 */
export default function CalculatorsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', color: '#f0f7e6', margin: 0 }}>
            Calculators
          </h1>
        </div>
        <div className={styles.sectionBody}>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.85rem', color: '#666', margin: 0 }}>
            Quick, free calculators for loan payments, seed populations, sprayer rates,
            and grain shrink. All results update as you type.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {CALCULATORS.map(c => (
          <Link key={c.path} href={c.path} className={styles.section}
            style={{ display: 'block', margin: 0, padding: '1.1rem 1.25rem', textDecoration: 'none' }}>
            <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.05rem', color: '#2c4a1e', margin: '0 0 .35rem' }}>
              {c.name} &rarr;
            </h2>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.85rem', color: '#555', margin: 0, lineHeight: 1.5 }}>
              {c.blurb}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
