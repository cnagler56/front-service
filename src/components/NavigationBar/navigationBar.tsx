"use client";

import Link from "next/link";
import { useUser } from "@/src/lib/UserContext";

export const NavigationBar = () => {
  // The UserContext owns auth state. When sign-in / sign-up / sign-out fire,
  // the provider re-renders and this flips Sign In ↔ Logout automatically —
  // no custom event listening required.
  const { user } = useUser();
  const isLoggedIn = !!user;
  const isAdmin = user?.roles === 'ADMIN';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap');

        .farm-nav {
          width: 100%;
          background: #1a2e0f;
          border-bottom: 1px solid #2c4a1e;
          box-shadow: 0 2px 12px rgba(0,0,0,0.4);
          position: relative;
          z-index: 10;
        }

        .farm-nav ul {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: stretch;
          list-style: none;
          margin: 0;
          padding: 0;
          flex-wrap: wrap;
        }

        .farm-nav li {
          position: relative;
        }

        .farm-nav li a {
          font-family: 'Lato', sans-serif;
          font-weight: 400;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #a8cc78;
          text-decoration: none;
          display: flex;
          align-items: center;
          padding: 0.6rem 1.1rem;
          transition: color 0.2s ease, background 0.2s ease;
          white-space: nowrap;
        }

        .farm-nav li a:hover {
          color: #f0f7e6;
          background: rgba(143, 188, 69, 0.12);
        }

        /* Separator dots between items */
        .farm-nav li + li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 1px;
          height: 14px;
          background: #2c4a1e;
        }

        /* Auth link styling */
        .farm-nav li a.auth-link,
        .farm-nav .dropdown-toggle.auth-link {
          color: #8fbc45;
          font-weight: 700;
        }

        .farm-nav li a.auth-link:hover {
          color: #f0f7e6;
          background: rgba(143, 188, 69, 0.2);
        }

        /* Highlighted "challenge" call-to-action link */
        .farm-nav li a.challenge-link {
          color: #1a2e0f;
          background: #8fbc45;
          font-weight: 700;
          border-radius: 4px;
          margin: 0 .3rem;
          box-shadow: 0 1px 6px rgba(143, 188, 69, 0.45);
        }

        .farm-nav li a.challenge-link:hover {
          color: #1a2e0f;
          background: #a8cc78;
        }

        /* Suppress the underline indicator on the pill-style challenge link */
        .farm-nav li a.challenge-link:hover::after {
          display: none;
        }

        /* Active link indicator */
        .farm-nav li a:hover::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 1.1rem;
          right: 1.1rem;
          height: 2px;
          background: #8fbc45;
          border-radius: 2px 2px 0 0;
        }

        .farm-nav li a {
          position: relative;
        }

        /* ── Dropdown menu ── */
        .farm-nav .dropdown-toggle {
          font-family: 'Lato', sans-serif;
          font-weight: 400;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #a8cc78;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.6rem 1.1rem;
          cursor: pointer;
          white-space: nowrap;
          transition: color 0.2s ease, background 0.2s ease;
        }
        .farm-nav .has-dropdown:hover > .dropdown-toggle,
        .farm-nav .has-dropdown:focus-within > .dropdown-toggle {
          color: #f0f7e6;
          background: rgba(143, 188, 69, 0.12);
        }
        .farm-nav .dropdown {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          min-width: 210px;
          background: #1a2e0f;
          border: 1px solid #2c4a1e;
          box-shadow: 0 6px 18px rgba(0,0,0,0.45);
          list-style: none;
          margin: 0;
          padding: 0.25rem 0;
          z-index: 20;
        }
        .farm-nav .has-dropdown:hover > .dropdown,
        .farm-nav .has-dropdown:focus-within > .dropdown {
          display: block;
        }
        .farm-nav .dropdown li { display: block; }
        .farm-nav .dropdown li + li::before { display: none; }
        .farm-nav .dropdown li a { padding: 0.55rem 1.2rem; }
        .farm-nav .dropdown li a:hover::after { display: none; }
        .farm-nav .dropdown li a:hover { background: rgba(143, 188, 69, 0.18); }
      `}</style>

      <nav className="farm-nav">
        <ul>
          <li>
            <Link href="/home">Home</Link>
          </li>
          <li>
            <Link href="/usda-challenge" className="challenge-link">🏆 Yield Challenge</Link>
          </li>
          <li>
            <Link href="/usda-results">Results</Link>
          </li>
          <li className="has-dropdown">
            <span className="dropdown-toggle" role="button" tabIndex={0} aria-haspopup="true">
              Weather <span aria-hidden="true">▾</span>
            </span>
            <ul className="dropdown">
              <li>
                <Link href="/weather">Local Weather</Link>
              </li>
              <li>
                <Link href="/enso">El Niño / La Niña</Link>
              </li>
              <li>
                <Link href="/forecast-change">Change in Forecast</Link>
              </li>
              <li>
                <Link href="/forecast-map">Forecast Map</Link>
              </li>
            </ul>
          </li>
          <li>
            <Link href="/corn">Corn</Link>
          </li>
          <li className="has-dropdown">
            <span className="dropdown-toggle" role="button" tabIndex={0} aria-haspopup="true">
              Soybeans <span aria-hidden="true">▾</span>
            </span>
            <ul className="dropdown">
              <li>
                <Link href="/soybeans">Soybeans</Link>
              </li>
              <li>
                <Link href="/soybean-meal">Soybean Meal</Link>
              </li>
              <li>
                <Link href="/soybean-oil">Soybean Oil</Link>
              </li>
            </ul>
          </li>
          <li>
            <Link href="/wheat">Wheat</Link>
          </li>
          <li>
            <Link href="/cotton">Cotton</Link>
          </li>
          <li>
            <Link href="/ethanol">Ethanol</Link>
          </li>
          <li>
            <Link href="/energy">Energy</Link>
          </li>
          <li className="has-dropdown">
            <span className="dropdown-toggle" role="button" tabIndex={0} aria-haspopup="true">
              South America <span aria-hidden="true">▾</span>
            </span>
            <ul className="dropdown">
              <li>
                <Link href="/south-america/corn">Corn</Link>
              </li>
              <li>
                <Link href="/south-america/soybeans">Soybeans</Link>
              </li>
            </ul>
          </li>
          <li className="has-dropdown">
            <span className="dropdown-toggle" role="button" tabIndex={0} aria-haspopup="true">
              Canada <span aria-hidden="true">▾</span>
            </span>
            <ul className="dropdown">
              <li>
                <Link href="/canada/canola">Canola</Link>
              </li>
              <li>
                <Link href="/canada/wheat">Wheat</Link>
              </li>
              <li>
                <Link href="/canada/corn">Corn</Link>
              </li>
              <li>
                <Link href="/canada/soybeans">Soybeans</Link>
              </li>
            </ul>
          </li>
          <li>
            <Link href="/usda-reports">USDA Reports</Link>
          </li>
          <li>
            <Link href="/cattle">Cattle</Link>
          </li>
          <li>
            <Link href="/hogs">Hogs</Link>
          </li>
          <li>
            <Link href="/buysell">Buy / Sell</Link>
          </li>
          <li>
            <Link href="/cropprogress">Crop Progress</Link>
          </li>
          <li>
            <Link href="/calculators">Calculators</Link>
          </li>
          <li>
            <Link href="/contact">Contact Us</Link>
          </li>
          {isAdmin && (
            <li className="has-dropdown">
              <span className="dropdown-toggle auth-link" role="button" tabIndex={0} aria-haspopup="true">
                Admin <span aria-hidden="true">▾</span>
              </span>
              <ul className="dropdown">
                <li>
                  <Link href="/admin/announcement">Announcement</Link>
                </li>
                <li>
                  <Link href="/admin/wasde">WASDE Upload</Link>
                </li>
                <li>
                  <Link href="/admin/report-dates">Report Dates</Link>
                </li>
                <li>
                  <Link href="/feedback">📬 Feedback</Link>
                </li>
              </ul>
            </li>
          )}
          <li>
            {isLoggedIn ? (
              <Link href="/logout" className="auth-link">
                Logout
              </Link>
            ) : (
              <Link href="/signin" className="auth-link">
                Sign In
              </Link>
            )}
          </li>
        </ul>
      </nav>
    </>
  );
};
