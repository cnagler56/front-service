"use client";

import Link from "next/link";
import { useUser } from "@/src/lib/UserContext";

export const NavigationBar = () => {
  // The UserContext owns auth state. When sign-in / sign-up / sign-out fire,
  // the provider re-renders and this flips Sign In ↔ Logout automatically —
  // no custom event listening required.
  const { user } = useUser();
  const isLoggedIn = !!user;

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
        .farm-nav li a.auth-link {
          color: #8fbc45;
          font-weight: 700;
        }

        .farm-nav li a.auth-link:hover {
          color: #f0f7e6;
          background: rgba(143, 188, 69, 0.2);
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
      `}</style>

      <nav className="farm-nav">
        <ul>
          <li>
            <Link href="/home">Home</Link>
          </li>
          <li>
            <Link href="/corn">Corn</Link>
          </li>
          <li>
            <Link href="/soybeans">Soybeans</Link>
          </li>
          <li>
            <Link href="/wheat">Wheat</Link>
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
            <Link href="/usda">USDA</Link>
          </li>
          <li>
            <Link href="/cropprogress">Crop Progress</Link>
          </li>
          <li>
            <Link href="/calculators">Calculators</Link>
          </li>
          <li>
            <Link href="/fields">My Fields</Link>
          </li>
          <li>
            <Link href="/weather">Weather</Link>
          </li>
          <li>
            <Link href="/forecast-change">Change in Forecast</Link>
          </li>
          <li>
            <Link href="/forecast-map">Forecast Map</Link>
          </li>
          <li>
            <Link href="/nws">NWS</Link>
          </li>
          <li>
            <Link href="/contact">Contact Us</Link>
          </li>
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
