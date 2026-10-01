import { PAGES } from '@/src/lib/seo';
import styles from './PageAbout.module.css';

/**
 * "About this page" block rendered on the server below a page's dashboard.
 * The dashboards load their data in the browser, so without this the HTML a
 * search engine first sees is just "Loading…". Copy lives in src/lib/seo.ts.
 */
export default function PageAbout({ path }: { path: string }) {
  const page = PAGES[path];
  if (!page || page.about.length === 0) return null;
  return (
    <section className={styles.wrap} aria-labelledby="about-this-page">
      <div className={styles.card}>
        <h2 id="about-this-page">About this page</h2>
        {page.about.map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </section>
  );
}
