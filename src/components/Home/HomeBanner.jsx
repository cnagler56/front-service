'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/src/lib/api';
import CornFieldBanner from './CornFieldBanner';
import WheatFieldBanner from './WheatFieldBanner';
import RainFieldBanner from './RainFieldBanner';
import CombineCrashBanner from './CombineCrashBanner';

/**
 * Renders whichever animated banner the admin picked (Admin → Home Banner).
 * The choice lives in the backend (site_setting 'home_banner'); this fetches
 * it and mounts the matching component. Unknown values and fetch failures
 * fall back to corn, 'none' hides the banner entirely.
 *
 * While the setting loads we hold the banner's exact space with a sky-toned
 * placeholder so the page doesn't jump when the animation mounts.
 */
export const BANNERS = {
  corn:  CornFieldBanner,
  wheat: WheatFieldBanner,
  rain:  RainFieldBanner,
  crash: CombineCrashBanner,
};

const PLACEHOLDER_STYLE = {
  width: '100%',
  height: 'clamp(120px, 18vw, 170px)',
  borderRadius: 8,
  marginBottom: '2rem',
  border: '1px solid #ddd8cc',
  background: 'linear-gradient(180deg, #dfe7ee 0%, #ebecdc 60%, #f2edda 100%)',
};

const HomeBanner = () => {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    let live = true;
    api.getHomeBanner()
      .then((d) => { if (live) setBanner(d.banner || 'corn'); })
      .catch(() => { if (live) setBanner('corn'); });
    return () => { live = false; };
  }, []);

  if (banner === null) return <div style={PLACEHOLDER_STYLE} aria-hidden="true" />;
  if (banner === 'none') return null;

  const Banner = BANNERS[banner] || CornFieldBanner;
  return <Banner />;
};

export default HomeBanner;
