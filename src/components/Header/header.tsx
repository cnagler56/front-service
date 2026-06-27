'use client';

import React from "react";
import { useUser } from "@/src/lib/UserContext";

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

const Header = () => {
  const { user } = useUser();
  const first = cap(user?.firstName ?? '');
  const last  = cap(user?.lastName  ?? '');
  const welcomeMessage = first ? `Welcome, ${first} ${last}`.trim() : '';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700&family=Lato:wght@300;400&display=swap');

        .farm-header {
          width: 100%;
          background:
            linear-gradient(180deg, #16222f 0%, #0d141d 100%);
          border-bottom: 1px solid var(--ckpt-amber);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2.5rem;
          height: 80px;
          box-shadow: 0 2px 24px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(255,178,77,.25);
          position: relative;
          overflow: hidden;
        }

        /* Subtle scanline sheen across the panel */
        .farm-header::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 3px);
          pointer-events: none;
        }

        .farm-site-title {
          font-family: 'Orbitron', 'Lato', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--ckpt-text);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          text-shadow: var(--ckpt-glow-cyan);
          position: relative;
          z-index: 1;
        }

        .farm-site-title .leaf-icon {
          color: var(--ckpt-amber);
          font-size: 1.15rem;
          line-height: 1;
          text-shadow: var(--ckpt-glow-amber);
        }

        .farm-welcome {
          font-family: 'Lato', sans-serif;
          font-weight: 400;
          font-size: 0.78rem;
          color: var(--ckpt-cyan);
          letter-spacing: 0.14em;
          text-transform: uppercase;
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .farm-welcome::before {
          content: '';
          display: inline-block;
          width: 7px;
          height: 7px;
          background: var(--ckpt-green);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--ckpt-green);
          animation: ckptPulse 2.2s ease-in-out infinite;
        }

        @keyframes ckptPulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: .35; }
        }
      `}</style>

      <header className="farm-header">
        <h1 className="farm-site-title">
          <span className="leaf-icon">◆</span>
          Just4Ag
        </h1>
        {welcomeMessage && <div className="farm-welcome">{welcomeMessage}</div>}
      </header>
    </>
  );
};

export default Header;
