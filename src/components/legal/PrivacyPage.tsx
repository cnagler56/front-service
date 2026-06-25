import Link from 'next/link';
import styles from '@/src/styles/farm.module.css';

const EFFECTIVE_DATE = 'June 18, 2026';
const CONTACT_EMAIL = 'info@just4ag.com';

/**
 * /privacy — Privacy Policy.
 *
 * Plain-language starting template that reflects what Just4Ag actually stores
 * (accounts, a session cookie, user-submitted content, and optional browser
 * geolocation for local weather). NOT legal advice — have an attorney review
 * before relying on it publicly.
 */
export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.section} style={{ maxWidth: 820, margin: '0 auto' }}>
        <div className={styles.sectionHead}>
          
          <h2>Privacy Policy</h2>
        </div>
        <div className={styles.sectionBody} style={{ fontFamily: 'Lato, sans-serif', color: '#333', lineHeight: 1.7, fontSize: '.92rem' }}>
          <p style={{ color: '#6a7a55', fontSize: '.82rem', margin: '0 0 1.5rem' }}>
            Effective date: <strong>{EFFECTIVE_DATE}</strong>
          </p>

          <Clause n="1" title="Overview">
            This Privacy Policy explains what information Just4Ag (&ldquo;we,&rdquo; &ldquo;us&rdquo;) collects, how we
            use it, and the choices you have. It applies to your use of the Just4Ag website and services. By using the
            Service, you agree to this Policy and our{' '}
            <Link href="/terms" style={linkStyle}>Terms of Service</Link>.
          </Clause>

          <Clause n="2" title="Information you provide">
            <ul style={listStyle}>
              <li>
                <strong>Account information</strong> — when you register, we collect your name, email address, city,
                state, and the role you select (e.g. Farmer, Student, Investor). Your password is stored only as a
                secure one-way hash; we never store it in plain text.
              </li>
              <li>
                <strong>Content you submit</strong> — buy/sell listings (including any contact details you choose to
                include), yield estimates and guesses, and messages you send through the Contact / feedback form. Some
                of this content (for example, a public listing or a community yield guess with your name) is visible to
                other users by design.
              </li>
            </ul>
          </Clause>

          <Clause n="3" title="Information collected automatically">
            <ul style={listStyle}>
              <li>
                <strong>Session cookie</strong> — when you sign in we set a single, HttpOnly cookie that keeps you
                logged in. It holds an opaque session identifier, not your personal details, and is removed when you
                log out or the session expires.
              </li>
              <li>
                <strong>Basic technical data</strong> — like most websites, our servers may log standard request
                information (such as approximate request times and error details) to keep the Service running and
                secure.
              </li>
              <li>
                <strong>Local storage</strong> — some features (for example, a draft yield estimate) save data in your
                own browser. That stays on your device and is not sent to us until you submit it.
              </li>
            </ul>
          </Clause>

          <Clause n="4" title="Location information">
            Some features — such as your local weather forecast and soil-moisture readings — can use your device&rsquo;s
            location. We only access it if your browser asks you and you allow it. When you do, your approximate
            coordinates are sent to our server to retrieve forecast and soil data for your area from third-party
            sources. You can decline or revoke this permission in your browser at any time.
          </Clause>

          <Clause n="5" title="How we use your information">
            <ul style={listStyle}>
              <li>To create and operate your account and keep you signed in.</li>
              <li>To provide the Service&rsquo;s features — listings, community estimates, weather, and market data.</li>
              <li>To respond to your feedback and support requests.</li>
              <li>To secure the Service, prevent abuse, and comply with law.</li>
            </ul>
            We do <strong>not</strong> sell your personal information, and we do not use it for third-party advertising.
          </Clause>

          <Clause n="6" title="How information is shared">
            <ul style={listStyle}>
              <li>
                <strong>With other users</strong> — only the content you choose to make public (e.g. a listing or a
                community guess). Guesses you submit to the USDA Challenge are public and appear, by your name, in the
                community roster and leaderboard.
              </li>
              <li>
                <strong>Service providers</strong> — we use an email provider (Brevo) to send transactional emails such
                as password resets. They process that data only to deliver the email.
              </li>
              <li>
                <strong>Legal reasons</strong> — we may disclose information if required by law or to protect the
                rights, safety, or property of Just4Ag or others.
              </li>
            </ul>
          </Clause>

          <Clause n="7" title="Third-party data sources">
            The Service displays data from third parties (USDA NASS and AMS, the National Weather Service, NASA POWER,
            the U.S. Drought Monitor, and market-quote providers). We request this data from those providers; aside from
            approximate coordinates needed to fetch a forecast for your area, we do not share your personal information
            with them. Their data and services are subject to their own terms and privacy practices.
          </Clause>

          <Clause n="8" title="Data retention">
            We keep your account information for as long as your account is active. Content you post may remain visible
            until you remove it or we remove it. Expired login sessions are cleaned up automatically. When you ask us to
            delete your account, we will delete or de-identify your personal information except where we must retain it
            to comply with law or resolve disputes.
          </Clause>

          <Clause n="9" title="Your choices and rights">
            <ul style={listStyle}>
              <li>You can review and update your account details while signed in.</li>
              <li>You can remove listings and other content you posted.</li>
              <li>You can request access to, correction of, or deletion of your personal information.</li>
              <li>You can control or revoke location permission in your browser.</li>
            </ul>
            To make a request, contact us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>{CONTACT_EMAIL}</a> or through the{' '}
            <Link href="/contact" style={linkStyle}>Contact page</Link>. Depending on where you live, you may have
            additional rights under local law.
          </Clause>

          <Clause n="10" title="Security">
            We take reasonable measures to protect your information — for example, hashing passwords, using HttpOnly
            session cookies, and limiting access. No method of transmission or storage is completely secure, so we
            cannot guarantee absolute security.
          </Clause>

          <Clause n="11" title="Children">
            The Service is not directed to children, and you must meet the minimum age in our{' '}
            <Link href="/terms" style={linkStyle}>Terms of Service</Link> to use it. We do not knowingly collect
            personal information from children. If you believe a child has provided us information, contact us and we
            will delete it.
          </Clause>

          <Clause n="12" title="Changes to this Policy">
            We may update this Policy from time to time. When we make material changes, we will update the effective
            date above. Your continued use of the Service after changes take effect constitutes acceptance of the
            updated Policy.
          </Clause>

          <Clause n="13" title="Contact">
            Questions about this Policy or your data? Reach us through the{' '}
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
const listStyle = { margin: '.25rem 0 0', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '.45rem' } as const;

function Clause({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '1.4rem' }}>
      <h3 style={{
        fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.05rem', color: '#2c4a1e',
        margin: '0 0 .4rem',
      }}>
        {n}. {title}
      </h3>
      <div style={{ margin: 0 }}>{children}</div>
    </section>
  );
}
