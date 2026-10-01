import Link from 'next/link';
import styles from '@/src/styles/farm.module.css';
import { PAGES } from '@/src/lib/seo';
import { CALCULATORS } from './calculatorList';

const prose: React.CSSProperties = {
  fontFamily: 'Lato, sans-serif', fontSize: '.9rem', lineHeight: 1.6, color: '#444', margin: '0 0 .75rem',
};

/**
 * Server-rendered frame for a single-calculator page: heading and intro, the
 * interactive calculator, a "how it's calculated" explanation, and links to
 * the other calculators. Everything except the calculator itself is in the
 * initial HTML, so search engines see the explanation without running JS.
 */
export default function CalculatorShell({ path, heading, howItWorks, children }: {
  path: string;
  heading: string;
  howItWorks: React.ReactNode;
  children: React.ReactNode;
}) {
  const others = CALCULATORS.filter(c => c.path !== path);
  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', color: '#f0f7e6', margin: 0 }}>
            {heading}
          </h1>
        </div>
        <div className={styles.sectionBody}>
          {PAGES[path]?.about.map((p, i) => <p key={i} style={{ ...prose, margin: 0 }}>{p}</p>)}
        </div>
      </div>

      {children}

      <div className={styles.section}>
        <div className={styles.sectionHead}><h2>How it&rsquo;s calculated</h2></div>
        <div className={styles.sectionBody} style={prose}>{howItWorks}</div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}><h2>More calculators</h2></div>
        <div className={styles.sectionBody}>
          <ul style={{ ...prose, margin: 0, paddingLeft: '1.1rem' }}>
            {others.map(c => (
              <li key={c.path}>
                <Link href={c.path} style={{ color: '#2c4a1e', fontWeight: 700 }}>{c.name}</Link>
                {' '}&mdash; {c.blurb}
              </li>
            ))}
            <li><Link href="/calculators" style={{ color: '#2c4a1e' }}>All calculators</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/** A formula line, set off from the prose. */
export function Formula({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: '.85rem',
      background: '#f4f0e8', border: '1px solid #ddd8cc', borderRadius: 4,
      padding: '.5rem .75rem', margin: '0 0 .75rem', overflowX: 'auto',
    }}>
      {children}
    </p>
  );
}
