'use client';

import { Fragment, useState } from 'react';
import farm from '@/src/styles/farm.module.css';
import styles from './cropCalendar.module.css';
import {
  SOUTH_AMERICA_CALENDAR,
  MONTH_INITIALS,
  MONTH_NAMES,
  type CropCalendarRow,
} from './cropCalendar';

interface Props {
  /** WASDE key of the current crop page (e.g. "CORN") — its rows are emphasized. */
  commodity?: string;
  rows?: CropCalendarRow[];
  title?: string;
}

/**
 * Planting/harvest calendar for the South American crops. A month-by-month
 * Gantt: green = planting window, amber = harvest window, with the current
 * month outlined. Rows matching the current crop page are highlighted.
 */
export default function CropCalendarPanel({
  commodity,
  rows = SOUTH_AMERICA_CALENDAR,
  title = 'Planting & Harvest Calendar',
}: Props) {
  const nowMonth = new Date().getMonth();
  const key = commodity?.toUpperCase();
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className={farm.section}>
      <div className={farm.sectionHead}>
        <h2>{title}</h2>
        <button
          type="button"
          className={styles.infoBtn}
          aria-expanded={infoOpen}
          aria-controls="sa-corn-crops-info"
          aria-label="About Brazil's three corn crops"
          title="About Brazil's three corn crops"
          onClick={() => setInfoOpen((v) => !v)}
        >
          i
        </button>
      </div>
      <div className={farm.sectionBody}>
        {infoOpen && (
          <div className={styles.infoBox} id="sa-corn-crops-info" role="region" aria-label="Brazil's three corn crops">
            <button
              type="button"
              className={styles.infoClose}
              aria-label="Close"
              onClick={() => setInfoOpen(false)}
            >
              ×
            </button>
            <h3>Brazil&apos;s three corn crops</h3>
            <p>Brazil plants corn in up to three successive windows across the year:</p>
            <ul>
              <li>
                <strong>First crop</strong> (<em>primeira safra</em>) — the full-season summer crop,
                planted Aug–Nov, mainly in the south, and harvested early the next year. Historically
                Brazil&apos;s main corn crop.
              </li>
              <li>
                <strong>Second crop</strong> (<em>safrinha</em>) — planted Jan–Mar right after
                soybeans come off the same fields, and harvested mid-year (Jun–Aug). It&apos;s now
                roughly <strong>75% of Brazil&apos;s corn</strong> and the crop global markets watch
                most closely.
              </li>
              <li>
                <strong>Third crop</strong> (<em>terceira safra</em>) — a small crop grown mainly in a
                few northern states (e.g. Roraima) on a different calendar; a minor share of output.
              </li>
            </ul>
            <p>
              <strong>Why &ldquo;safrinha&rdquo;?</strong> It&apos;s Portuguese for &ldquo;little
              harvest&rdquo; — the diminutive of <em>safra</em> (harvest/crop). The name stuck from
              when this after-soybean planting was a small secondary crop. It has since grown into
              Brazil&apos;s largest corn crop, but the nickname remains.
            </p>
          </div>
        )}

        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.swatch} style={{ background: '#3d6b2a' }} /> Planting
          </span>
          <span className={styles.legendItem}>
            <span className={styles.swatch} style={{ background: '#c9892a' }} /> Harvest
          </span>
          <span className={styles.legendItem}>
            <span className={styles.swatchNow} /> {MONTH_NAMES[nowMonth]} (now)
          </span>
        </div>

        <div className={styles.scroll}>
          <div
            className={styles.grid}
            role="img"
            aria-label={`Crop planting and harvest calendar for South America. ${rows
              .map(
                (r) =>
                  `${r.region} ${r.crop}: plant ${r.plant
                    .map((m) => MONTH_NAMES[m])
                    .join(', ')}; harvest ${r.harvest.map((m) => MONTH_NAMES[m]).join(', ')}.`,
              )
              .join(' ')}`}
          >
            {/* Header row: corner + month initials */}
            <div className={styles.corner} aria-hidden="true" />
            {MONTH_INITIALS.map((m, i) => (
              <div
                key={`h-${i}`}
                className={`${styles.month}${i === nowMonth ? ` ${styles.monthNow}` : ''}`}
                aria-hidden="true"
              >
                {m}
              </div>
            ))}

            {/* One row per crop */}
            {rows.map((r, ri) => {
              const matched = !!key && r.commodities.includes(key);
              const firstOfRegion = ri === 0 || rows[ri - 1].region !== r.region;
              return (
                <Fragment key={`${r.region}-${r.crop}`}>
                  <div
                    className={`${styles.rowLabel}${matched ? ` ${styles.matched}` : ''}`}
                    aria-hidden="true"
                  >
                    {matched && <span className={styles.dot} />}
                    {firstOfRegion && <span className={styles.region}>{r.region}</span>}
                    {firstOfRegion ? ' · ' : ''}
                    {r.crop}
                  </div>
                  {MONTH_INITIALS.map((_, mi) => {
                    const phase = r.plant.includes(mi)
                      ? styles.plant
                      : r.harvest.includes(mi)
                        ? styles.harvest
                        : '';
                    return (
                      <div
                        key={`${ri}-${mi}`}
                        className={`${styles.cell} ${phase}${mi === nowMonth ? ` ${styles.now}` : ''}`}
                        aria-hidden="true"
                      />
                    );
                  })}
                </Fragment>
              );
            })}
          </div>
        </div>

        <p className={styles.note}>
          Typical national windows — actual dates shift by region (e.g. Mato Grosso runs earlier
          than Rio Grande do Sul) and by season. Sources: USDA FAS/IPAD, CONAB, Bolsa de Cereales.
        </p>
      </div>
    </div>
  );
}
