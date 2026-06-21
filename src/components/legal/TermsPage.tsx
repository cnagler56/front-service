import Link from 'next/link';
import styles from '@/src/styles/farm.module.css';

const EFFECTIVE_DATE = 'June 18, 2026';
const CONTACT_EMAIL = 'info@just4ag.com';
const GOVERNING_STATE = 'Minnesota'; // ← set to the state whose laws should govern

/**
 * /terms — Terms of Service.
 *
 * This is a plain-language starting template tailored to what Just4Ag does
 * (accounts, buy/sell listings, community estimates, third-party market &
 * weather data). It is NOT legal advice — have a licensed attorney review and
 * adapt it before you rely on it publicly.
 */
export default function TermsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.section} style={{ maxWidth: 820, margin: '0 auto' }}>
        <div className={styles.sectionHead}>
          <span>📜</span>
          <h2>Terms of Service</h2>
        </div>
        <div className={styles.sectionBody} style={{ fontFamily: 'Lato, sans-serif', color: '#333', lineHeight: 1.7, fontSize: '.92rem' }}>
          <p style={{ color: '#6a7a55', fontSize: '.82rem', margin: '0 0 1.5rem' }}>
            Effective date: <strong>{EFFECTIVE_DATE}</strong>
          </p>

          <Clause n="1" title="Acceptance of these Terms">
            Welcome to Just4Ag (the &ldquo;Service&rdquo;). These Terms of Service (&ldquo;Terms&rdquo;) are a binding
            agreement between you and Just4Ag (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By accessing or
            using the Service, creating an account, or submitting any content, you agree to these Terms and our{' '}
            <Link href="/privacy" style={linkStyle}>Privacy Policy</Link>. If you do not agree, do not use the Service.
          </Clause>

          <Clause n="2" title="What Just4Ag is">
            Just4Ag is an informational platform for farmers, analysts, and agriculture enthusiasts. It aggregates and
            displays third-party data (such as commodity futures prices, USDA reports, crop progress, and weather
            forecasts), and offers community features including yield-estimate games, a buy/sell listings board, and
            feedback. The Service is provided for general informational and educational purposes only.
          </Clause>

          <Clause n="3" title="Eligibility and accounts">
            You must be at least 18 years old (or the age of majority where you live) to create an account. You agree to
            provide accurate information, to keep your password confidential, and that you are responsible for all
            activity under your account. Notify us promptly at {CONTACT_EMAIL} if you suspect unauthorized use. We may
            suspend or terminate accounts that violate these Terms.
          </Clause>

          <Clause n="4" title="Not financial, investment, or agronomic advice">
            Nothing on the Service is financial, investment, trading, tax, legal, or agronomic advice, and nothing is a
            recommendation to buy or sell any commodity, futures contract, or other instrument. Market prices, basis,
            yield estimates, forecasts, and similar figures are provided for general information, may be delayed,
            incomplete, or inaccurate, and should not be relied upon for trading or operational decisions. Always
            confirm with primary sources and qualified professionals before acting. You are solely responsible for any
            decisions you make.
          </Clause>

          <Clause n="5" title="Third-party data and sources">
            The Service displays data from third parties, including USDA NASS and AMS, the National Weather Service,
            NASA POWER, the U.S. Drought Monitor, and market-quote providers. We do not create this data, do not
            guarantee its accuracy, timeliness, or availability, and are not responsible for it. Market quotes are
            generally delayed and are not official exchange settlements. Your use of third-party data may also be
            subject to those providers&rsquo; own terms.
          </Clause>

          <Clause n="6" title="Community content and the buy/sell board">
            You are responsible for any content you submit — including buy/sell listings, yield estimates, names, and
            feedback (&ldquo;User Content&rdquo;). You agree not to post anything unlawful, misleading, fraudulent,
            infringing, abusive, or that you do not have the right to share. By submitting User Content, you grant us a
            non-exclusive, royalty-free license to host, display, and distribute it within the Service.
            <br /><br />
            The buy/sell board is a venue only. Just4Ag is <strong>not a party</strong> to any transaction between
            users, does not verify listings, users, goods, or prices, and does not endorse any listing. Any purchase,
            sale, or dealing is solely between the users involved, at their own risk. We may remove any content or
            listing at our discretion.
          </Clause>

          <Clause n="7" title="Yield Challenge and community games">
            Yield estimates, leaderboards, and similar games are offered for informational and entertainment purposes
            only. They are not contests of chance, do not involve wagering, and (unless expressly stated in writing)
            do not award prizes. Results are based on publicly available data and are not guaranteed to be accurate.
          </Clause>

          <Clause n="8" title="Acceptable use">
            You agree not to: misuse or disrupt the Service; attempt to gain unauthorized access; scrape, harvest, or
            redistribute data in violation of these Terms or a data provider&rsquo;s terms; upload malicious code;
            impersonate others; or use the Service to violate any law. We may investigate and take appropriate action,
            including removing content and suspending accounts.
          </Clause>

          <Clause n="9" title="Intellectual property">
            The Service&rsquo;s design, software, and original content are owned by Just4Ag or its licensors and are
            protected by applicable law. We grant you a limited, personal, non-transferable license to use the Service
            for its intended purpose. Third-party data and trademarks remain the property of their respective owners.
          </Clause>

          <Clause n="10" title="Disclaimer of warranties">
            The Service and all data are provided <strong>&ldquo;as is&rdquo; and &ldquo;as available,&rdquo;</strong>{' '}
            without warranties of any kind, express or implied, including merchantability, fitness for a particular
            purpose, accuracy, and non-infringement. We do not warrant that the Service will be uninterrupted,
            error-free, or secure, or that any data is accurate or current.
          </Clause>

          <Clause n="11" title="Limitation of liability">
            To the fullest extent permitted by law, Just4Ag and its operators will not be liable for any indirect,
            incidental, special, consequential, or punitive damages, or for any loss of profits, data, or goodwill,
            arising from your use of (or inability to use) the Service or any reliance on data provided through it.
            Our total liability for any claim relating to the Service will not exceed one hundred U.S. dollars (US$100).
          </Clause>

          <Clause n="12" title="Indemnification">
            You agree to indemnify and hold harmless Just4Ag and its operators from any claims, damages, losses, and
            expenses (including reasonable attorneys&rsquo; fees) arising from your User Content, your use of the
            Service, or your violation of these Terms or any law or third-party right.
          </Clause>

          <Clause n="13" title="Termination">
            You may stop using the Service at any time. We may suspend or terminate your access, with or without notice,
            if we believe you have violated these Terms or to protect the Service or other users. Sections that by their
            nature should survive termination (including disclaimers, limitation of liability, and indemnification) will
            survive.
          </Clause>

          <Clause n="14" title="Changes to the Service or these Terms">
            We may modify or discontinue the Service, or update these Terms, at any time. When we make material changes
            to these Terms, we will update the effective date above. Your continued use of the Service after changes
            take effect constitutes acceptance of the revised Terms.
          </Clause>

          <Clause n="15" title="Governing law">
            These Terms are governed by the laws of the State of {GOVERNING_STATE}, without regard to its conflict-of-laws
            rules. You agree to the exclusive jurisdiction of the state and federal courts located in {GOVERNING_STATE}
            for any dispute that is not subject to arbitration or small-claims court.
          </Clause>

          <Clause n="16" title="Contact">
            Questions about these Terms? Reach us through the{' '}
            <Link href="/contact" style={linkStyle}>Contact page</Link> or at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>{CONTACT_EMAIL}</a>.
          </Clause>

          <p style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e1dccc', fontSize: '.8rem', color: '#999' }}>
            This page is a general template and not legal advice. Consider having a licensed attorney review it for your
            specific situation before relying on it.
          </p>
        </div>
      </div>
    </div>
  );
}

const linkStyle = { color: '#3d6b2a', fontWeight: 700 } as const;

function Clause({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '1.4rem' }}>
      <h3 style={{
        fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.05rem', color: '#2c4a1e',
        margin: '0 0 .4rem',
      }}>
        {n}. {title}
      </h3>
      <p style={{ margin: 0 }}>{children}</p>
    </section>
  );
}
