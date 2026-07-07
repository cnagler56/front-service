'use client';

import { useEffect, useState } from 'react';
import { api } from '@/src/lib/api';
import { useUser } from '@/src/lib/UserContext';
import CornFieldBanner from '@/src/components/Home/CornFieldBanner';
import WheatFieldBanner from '@/src/components/Home/WheatFieldBanner';
import RainFieldBanner from '@/src/components/Home/RainFieldBanner';
import CombineCrashBanner from '@/src/components/Home/CombineCrashBanner';
import styles from '@/src/styles/farm.module.css';

const OPTIONS: {
  key: string;
  label: string;
  desc: string;
  Preview: React.ComponentType | null;
}[] = [
  {
    key: 'corn',
    label: 'Corn Field',
    desc: 'A corn stand sprouts, leafs out, tassels, and sways in the breeze.',
    Preview: CornFieldBanner,
  },
  {
    key: 'wheat',
    label: 'Wheat Harvest',
    desc: 'Golden wheat at sunset with wind gusts rolling across the field.',
    Preview: WheatFieldBanner,
  },
  {
    key: 'rain',
    label: 'Spring Rain',
    desc: 'Rain falls on wet soil while young seedlings pop up.',
    Preview: RainFieldBanner,
  },
  {
    key: 'crash',
    label: 'Combine Crash',
    desc: 'Two combines meet in the middle of the field — harvest drama with a bang, then a safety reminder.',
    Preview: CombineCrashBanner,
  },
  {
    key: 'none',
    label: 'No banner',
    desc: 'Hide the animation entirely — the home page starts at the announcement.',
    Preview: null,
  },
];

/**
 * Admin-only page to choose which animated banner the home page shows.
 * Each option renders its real component as a live preview; picking one and
 * saving stores the choice in the backend (site_setting 'home_banner').
 */
export default function BannerAdminPage() {
  const { user } = useUser();
  const isAdmin = user?.roles === 'ADMIN';

  const [current, setCurrent] = useState<string | null>(null);   // saved value
  const [selected, setSelected] = useState<string | null>(null); // radio state
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    api.getHomeBanner()
      .then((d) => { setCurrent(d.banner); setSelected(d.banner); })
      .catch(() => { setCurrent('corn'); setSelected('corn'); });
  }, [isAdmin]);

  async function save() {
    if (!selected) return;
    setBusy(true);
    setMsg(null);
    try {
      const saved = await api.setHomeBanner(selected);
      setCurrent(saved.banner);
      setMsg({ ok: true, text: `Home page banner set to "${label(saved.banner)}".` });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Save failed.' });
    } finally {
      setBusy(false);
    }
  }

  function label(key: string): string {
    return OPTIONS.find((o) => o.key === key)?.label ?? key;
  }

  if (!isAdmin) {
    return (
      <div className={styles.page}>
        <div className={styles.section} style={{ maxWidth: 560, margin: '0 auto' }}>
          <div className={styles.sectionHead}><h2>Admins Only</h2></div>
          <div className={styles.sectionBody}>
            <p style={{ fontFamily: 'Lato, sans-serif', color: '#666' }}>
              You need an admin account to change the home page banner.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <p style={{ fontFamily: 'Lato, sans-serif', color: '#555', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
          Pick the animation visitors see at the top of the home page. Previews below are live —
          what you see is exactly what ships.
        </p>

        {msg && (
          <div style={{
            background: msg.ok ? '#f0fdf4' : '#fdf0f0',
            border: `1px solid ${msg.ok ? '#27ae60' : '#e74c3c'}`,
            color: msg.ok ? '#1a7f37' : '#c0392b',
            borderRadius: 4, padding: '.7rem .95rem', fontSize: '.88rem',
            marginBottom: '1rem', fontFamily: 'Lato, sans-serif',
          }}>
            {msg.text}
          </div>
        )}

        {OPTIONS.map(({ key, label: name, desc, Preview }) => {
          const isSelected = selected === key;
          const isLive = current === key;
          return (
            <div
              key={key}
              onClick={() => setSelected(key)}
              style={{
                border: `2px solid ${isSelected ? '#8fbc45' : '#ddd8cc'}`,
                background: isSelected ? '#fbfdf6' : '#fff',
                borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '1.25rem',
                cursor: 'pointer', transition: 'border-color .15s, background .15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginBottom: Preview ? '.9rem' : 0 }}>
                <input
                  type="radio"
                  name="banner"
                  checked={isSelected}
                  onChange={() => setSelected(key)}
                  style={{ accentColor: '#3d6b2a', width: 16, height: 16 }}
                />
                <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700, fontSize: '1.05rem', color: '#2c4a1e' }}>
                  {name}
                </span>
                {isLive && (
                  <span style={{
                    fontFamily: 'Lato, sans-serif', fontSize: '.68rem', fontWeight: 700,
                    letterSpacing: '.08em', textTransform: 'uppercase',
                    color: '#1a7f37', background: '#eaf7ee', border: '1px solid #b7e0c3',
                    borderRadius: 999, padding: '.15rem .6rem',
                  }}>
                    Live now
                  </span>
                )}
                <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '.83rem', color: '#7a8a65', marginLeft: 'auto' }}>
                  {desc}
                </span>
              </div>
              {Preview && <Preview />}
            </div>
          );
        })}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className={styles.btn}
            onClick={save}
            disabled={busy || selected === null || selected === current}
            type="button"
          >
            {busy ? 'Saving…' : selected === current ? 'Saved' : 'Save banner'}
          </button>
        </div>
      </div>
    </div>
  );
}
