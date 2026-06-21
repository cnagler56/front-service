import Link from 'next/link';

/** Site-wide footer with legal + contact links. Rendered once in the layout. */
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      style={{
        marginTop: '2.5rem',
        background: '#1a2e0f',
        borderTop: '1px solid #2c4a1e',
        color: '#a8cc78',
        fontFamily: 'Lato, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '.75rem',
        }}
      >
        <span style={{ fontSize: '.8rem', color: '#8aa06a' }}>
          © {year} Just4Ag. Market &amp; weather data is informational only and may be delayed.
        </span>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '1.1rem', fontSize: '.8rem' }}>
          <FooterLink href="/terms">Terms of Service</FooterLink>
          <FooterLink href="/privacy">Privacy Policy</FooterLink>
          <FooterLink href="/contact">Contact</FooterLink>
        </nav>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{ color: '#a8cc78', textDecoration: 'none', fontWeight: 600 }}
    >
      {children}
    </Link>
  );
}
