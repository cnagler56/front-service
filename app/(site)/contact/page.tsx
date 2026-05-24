import styles from '@/src/styles/farm.module.css';

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <div className={styles.section} style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className={styles.sectionHead}>
          <span>📬</span>
          <h2>Contact Us</h2>
        </div>
        <div className={styles.sectionBody}>
          <p style={{ fontFamily: 'Lato, sans-serif', color: '#555', lineHeight: 1.7, margin: '0 0 1rem' }}>
            Just4Ag is a community platform for farmers, analysts, and agriculture enthusiasts.
            Have a question or suggestion? Reach out below.
          </p>
          <p style={{ fontFamily: 'Lato, sans-serif', color: '#555', margin: 0 }}>
            <strong style={{ color: '#2c4a1e' }}>Email:</strong>{' '}
            <a href="mailto:info@just4ag.com" style={{ color: '#3d6b2a' }}>info@just4ag.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
