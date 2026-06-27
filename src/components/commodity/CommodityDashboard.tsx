"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  api,
  CommodityGroup,
  CropProgressData,
  UsdaYieldReport,
} from "@/src/lib/api";
import { useUser } from "@/src/lib/UserContext";
import SupplyDemandBox from "./SupplyDemandBox";
import CotPanel from "./CotPanel";
import ExportSalesPanel from "./ExportSalesPanel";
import GrainStocksPanel from "./GrainStocksPanel";
import styles from "./commodityDashboard.module.css";

interface Props {
  commodity: string; // NASS / WASDE code: "CORN" / "SOYBEANS" / "SOYBEAN_MEAL" …
  commodityLabel: string; // "Corn" / "Soybeans" / "Soybean Meal"
  pricesGroupName: string; // matches CommodityGroup.name in /prices
  crushProduct?: boolean; // meal/oil: no NASS yield or crop progress, so hide those panels
  yieldUnit?: string; // NASS yield unit — "bu/acre" for grains, "lb/acre" for cotton
}

/** "AUG" → "Aug 2026", "YEAR" → "Final 2025" */
function refPeriodLabel(p: string | undefined, year: number): string {
  if (!p) return `${year}`;
  const map: Record<string, string> = {
    YEAR: "Final",
    MAY: "May",
    JUN: "Jun",
    JUL: "Jul",
    AUG: "Aug",
    SEP: "Sep",
    OCT: "Oct",
    NOV: "Nov",
    DEC: "Dec",
  };
  return `${map[p] ?? p} ${year}`;
}

function fmtNum(n: number | null | undefined, digits = 1): string {
  if (n == null || !isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

/**
 * Price formatter — no thousands separator. Futures contracts trade in cents
 * (corn ~445, soybeans ~1188.75) and quoting them with commas confuses readers
 * who expect to see the raw quote line.
 */
function fmtPrice(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return "—";
  return n.toFixed(2);
}

/** Unix seconds → "as of Jun 18, 1:20 PM" (the quote's timestamp from Yahoo). */
function fmtAsOf(sec: number | null | undefined): string {
  if (!sec) return "";
  const d = new Date(sec * 1000);
  if (isNaN(d.getTime())) return "";
  return `as of ${d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`;
}

function fmtWeek(iso: string): string {
  if (!iso) return "";
  const [, m, d] = iso.split("-");
  return m && d ? `${parseInt(m, 10)}/${parseInt(d, 10)}` : iso;
}

function stageLabel(unit: string | undefined): string {
  if (!unit) return "";
  const u = unit.toUpperCase().replace(/^PCT\s+/, "");
  return u.charAt(0) + u.substring(1).toLowerCase();
}

/**
 * Wheat progress is reported per class (Winter / Spring / Durum), and they're at
 * very different stages at any given week — so they must not be averaged together.
 * Returns a short class label, or '' for single-class crops (corn, soybeans).
 */
function cropClass(shortDesc: string | undefined): string {
  if (!shortDesc) return "";
  const head = shortDesc.split(" - ")[0].toUpperCase(); // e.g. "WHEAT, SPRING, DURUM"
  if (!head.startsWith("WHEAT")) return "";
  if (head.includes("WINTER")) return "Winter";
  if (head.includes("DURUM")) return "Durum";
  if (head.includes("SPRING")) return "Spring";
  return "";
}

/** Natural progression order so stage bars read in a sensible sequence. */
const STAGE_ORDER = [
  "PLANTED",
  "EMERGED",
  "BREAKING DORMANCY",
  "JOINTING",
  "BOOTED",
  "HEADED",
  "COLORING",
  "MATURE",
  "HARVESTED",
  "PASTURED",
];
function stageRank(unit: string): number {
  const i = STAGE_ORDER.indexOf(unit.toUpperCase().replace(/^PCT\s+/, ""));
  return i < 0 ? 99 : i;
}
const CLASS_ORDER: Record<string, number> = {
  "": 0,
  Winter: 1,
  Spring: 2,
  Durum: 3,
};

/** Production-weighted national yield from a list of state snapshots. */
function nationalAvg(
  rows: { yieldBu?: number; acres?: number | null }[],
): number | null {
  let wsum = 0,
    asum = 0;
  for (const r of rows) {
    if (r.yieldBu == null || !r.acres) continue;
    wsum += r.yieldBu * r.acres;
    asum += r.acres;
  }
  return asum > 0 ? wsum / asum : null;
}

export default function CommodityDashboard({
  commodity,
  commodityLabel,
  pricesGroupName,
  crushProduct = false,
  yieldUnit = "bu/acre",
}: Props) {
  const { user } = useUser();
  const [prices, setPrices] = useState<CommodityGroup | null>(null);
  const [yieldReport, setYieldReport] = useState<UsdaYieldReport | null>(null);
  const [progress, setProgress] = useState<CropProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const thisYear = new Date().getFullYear();

    Promise.all([
      api.getPrices().catch(() => [] as CommodityGroup[]),
      // Crush products (meal/oil) have no NASS yield or crop-progress series — skip those calls.
      crushProduct
        ? Promise.resolve(null)
        : api.getUsdaYield(commodity).catch(() => null),
      crushProduct
        ? Promise.resolve([] as CropProgressData[])
        : api
            .getCropProgress(commodity, thisYear)
            .catch(() => [] as CropProgressData[]),
    ])
      .then(([pricesAll, yieldData, cropProgress]) => {
        if (cancelled) return;
        setPrices(pricesAll.find((g) => g.name === pricesGroupName) ?? null);
        setYieldReport(yieldData);
        setProgress(cropProgress);
      })
      .catch(() => {
        if (!cancelled)
          setError(`Could not load ${commodityLabel} dashboard data.`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [commodity, commodityLabel, pricesGroupName, crushProduct]);

  // ── Derived: yield headline ───────────────────────────────────────────────
  const yieldHeadline = useMemo(() => {
    if (!yieldReport) return null;
    const currentNat = nationalAvg(yieldReport.currentEstimates);
    const priorNat = nationalAvg(yieldReport.priorYearFinal);
    const yoy =
      currentNat != null && priorNat != null && priorNat !== 0
        ? ((currentNat - priorNat) / priorNat) * 100
        : null;
    // Largest producer = the state contributing the most actual production
    // (yield × harvested acres), with its share of the US total. Unlike a raw
    // per-acre "top yielder", this reflects where the crop actually is.
    let best: { state: string; prod: number } | null = null;
    let totalProd = 0;
    for (const r of yieldReport.currentEstimates) {
      if (r.yieldBu == null || !r.acres) continue;
      const prod = r.yieldBu * r.acres;
      totalProd += prod;
      if (!best || prod > best.prod) best = { state: r.state, prod };
    }
    const topProducer =
      best && totalProd > 0
        ? { state: best.state, share: (best.prod / totalProd) * 100 }
        : null;
    return { currentNat, priorNat, yoy, topProducer };
  }, [yieldReport]);

  // ── Derived: this week's crop progress (national) ─────────────────────────
  const progressView = useMemo(() => {
    if (progress.length === 0) return null;
    // Get the latest week
    const weeks = Array.from(new Set(progress.map((r) => r.weekEnding))).sort();
    const latestWeek = weeks[weeks.length - 1];
    const latestRows = progress.filter((r) => r.weekEnding === latestWeek);

    // National average per (class, stage). Wheat classes (Winter/Spring/Durum)
    // are kept separate so we never average a winter-wheat stage against a
    // spring-wheat one. Single-class crops (corn/soy) get class ''.
    type Slot = { sum: number; n: number; cls: string; unit: string };
    const byStage = new Map<string, Slot>();
    for (const r of latestRows) {
      const v = parseFloat(r.value);
      if (!isFinite(v)) continue;
      const cls = cropClass(r.shortDesc);
      const slot = byStage.get(`${cls}|${r.unit}`) ?? {
        sum: 0,
        n: 0,
        cls,
        unit: r.unit,
      };
      slot.sum += v;
      slot.n += 1;
      byStage.set(`${cls}|${r.unit}`, slot);
    }
    const stages = Array.from(byStage.values())
      .map((s) => ({
        cls: s.cls,
        unit: s.unit,
        label: stageLabel(s.unit),
        nationalAvg: s.n > 0 ? s.sum / s.n : 0,
      }))
      // Drop stages that haven't started — a row of 0% bars just adds noise.
      .filter((s) => s.nationalAvg > 0)
      .sort(
        (a, b) =>
          (CLASS_ORDER[a.cls] ?? 9) - (CLASS_ORDER[b.cls] ?? 9) ||
          stageRank(a.unit) - stageRank(b.unit),
      );

    // Group by class so the repeated stage names read under a heading
    // (e.g. "Winter Wheat") instead of a confusing flat list.
    const groups: { cls: string; label: string; stages: typeof stages }[] = [];
    for (const s of stages) {
      let g = groups.find((grp) => grp.cls === s.cls);
      if (!g) {
        g = {
          cls: s.cls,
          label: s.cls ? `${s.cls} ${commodityLabel}` : "",
          stages: [],
        };
        groups.push(g);
      }
      g.stages.push(s);
    }
    return { latestWeek, groups };
  }, [progress, commodityLabel]);

  // ── Front contract for the price strip ────────────────────────────────────
  const frontPrice = prices?.contracts?.[0];

  if (loading) {
    return (
      <p className={styles.loading}>Loading {commodityLabel} dashboard…</p>
    );
  }
  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  return (
    <div className={styles.dashboard}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className={styles.heroHeader}>
        <h1>{commodityLabel}</h1>
        <p>
          {crushProduct
            ? `Futures and USDA WASDE supply & demand for ${commodityLabel.toLowerCase()}.`
            : `Everything for ${commodityLabel.toLowerCase()} at a glance — price, USDA estimates, this week's progress, and 5-year trend.`}
        </p>
      </div>

      {/* ── Bento row: Futures + USDA Yield side by side ───────── */}
      <div
        className={styles.bentoRow}
        style={crushProduct ? { gridTemplateColumns: "1fr" } : undefined}
      >
        {/* ── Price strip ────────────────────────────────────────── */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            
            <h2>Futures</h2>
            <Link href="/home" className={styles.headLink}>
              All commodities →
            </Link>
          </div>
          <div className={styles.priceStrip}>
            {!frontPrice ? (
              <p className={styles.empty}>Price unavailable.</p>
            ) : (
              <>
                <div className={styles.frontPrice}>
                  <div className={styles.frontLabel}>
                    {frontPrice.expiration} (front)
                  </div>
                  <div className={styles.frontValue}>
                    {fmtPrice(frontPrice.last)}{" "}
                    <span className={styles.unitLabel}>{prices?.unit}</span>
                  </div>
                  <ChangePill
                    change={frontPrice.change ?? null}
                    pct={frontPrice.changePercent ?? null}
                  />
                  {frontPrice.asOf && (
                    <div
                      style={{
                        fontFamily: "Lato, sans-serif",
                        fontSize: ".68rem",
                        color: "#8aa06a",
                        marginTop: ".3rem",
                      }}
                    >
                      {fmtAsOf(frontPrice.asOf)} · ~10-min delayed
                    </div>
                  )}
                </div>
                <div className={styles.deferredTable}>
                  {(prices?.contracts ?? []).slice(1).map((c) => (
                    <div key={c.symbol} className={styles.deferredRow}>
                      <span className={styles.deferredExp}>{c.expiration}</span>
                      <span className={styles.deferredLast}>
                        {fmtPrice(c.last)}
                      </span>
                      <ChangePill
                        compact
                        change={c.change ?? null}
                        pct={null}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          {prices && <CalendarSpreads group={prices} />}
        </div>

        {/* ── USDA Yield (crops only) ────────────────────────────── */}
        {!crushProduct && (
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              
              <h2>USDA Yield</h2>
              <Link href="/usda-reports" className={styles.headLink}>
                Adjust state-by-state →
              </Link>
            </div>
            {!yieldReport ? (
              <p className={styles.empty}>USDA yield data unavailable.</p>
            ) : (
              <div className={styles.statGrid}>
                <Stat
                  label={`Latest USDA (${refPeriodLabel(yieldReport.currentAsOf, yieldReport.currentYear)})`}
                  value={fmtNum(yieldHeadline?.currentNat, 1)}
                  unit={yieldUnit}
                  big
                />
                <Stat
                  label={`USDA Final ${yieldReport.priorYear}`}
                  value={fmtNum(yieldHeadline?.priorNat, 1)}
                  unit={yieldUnit}
                />
                <Stat
                  label="YoY Change"
                  value={
                    yieldHeadline?.yoy != null
                      ? `${yieldHeadline.yoy > 0 ? "+" : ""}${yieldHeadline.yoy.toFixed(1)}%`
                      : "—"
                  }
                  tone={
                    yieldHeadline?.yoy != null
                      ? yieldHeadline.yoy > 0
                        ? "up"
                        : yieldHeadline.yoy < 0
                          ? "down"
                          : undefined
                      : undefined
                  }
                />
                <Stat
                  label="Largest Producer"
                  value={
                    yieldHeadline?.topProducer
                      ? `${yieldHeadline.topProducer.state}`
                      : "—"
                  }
                  footnote={
                    yieldHeadline?.topProducer
                      ? `~${yieldHeadline.topProducer.share.toFixed(0)}% of US production`
                      : undefined
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>
      {/* end bento row */}

      {/* ── Bento row 2: Supply/Demand + Crop Progress ─────────── */}
      <div className={styles.bentoRow}>
        {/* ── Supply & Demand (WASDE) ────────────────────────────── */}
        <SupplyDemandBox
          commodity={commodity}
          commodityLabel={commodityLabel}
        />

        {/* ── Right column: Crop Progress (crops) stacked over Managed Money ── */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {/* ── Crop Progress (this week, crops only) ──────────────── */}
          {!crushProduct && (
            <div className={styles.section}>
              <div className={styles.sectionHead}>
                
                <h2>Crop Progress</h2>
                <Link href="/cropprogress" className={styles.headLink}>
                  Full report →
                </Link>
              </div>
              {!progressView ? (
                <p className={styles.empty}>
                  No crop progress data yet for {new Date().getFullYear()}.
                  Reports run April – November.
                </p>
              ) : (
                <>
                  <p className={styles.progressMeta}>
                    National · week ending{" "}
                    <strong>{fmtWeek(progressView.latestWeek)}</strong>
                  </p>
                  {progressView.groups.map((g) => (
                    <div
                      key={g.cls || "single"}
                      style={{ marginBottom: ".85rem" }}
                    >
                      {g.label && (
                        <div
                          style={{
                            fontFamily: "Lato, sans-serif",
                            fontSize: ".72rem",
                            fontWeight: 700,
                            color: "#3d6b2a",
                            textTransform: "uppercase",
                            letterSpacing: ".05em",
                            margin: ".75rem 1.25rem .4rem",
                          }}
                        >
                          {g.label}
                        </div>
                      )}
                      <div className={styles.stageGrid}>
                        {g.stages.map((s) => (
                          <StageBar
                            key={`${g.cls}|${s.unit}`}
                            label={s.label}
                            nationalAvg={s.nationalAvg}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
          <CotPanel commodity={commodity} commodityLabel={commodityLabel} />
        </div>
      </div>
      {/* end bento row 2 */}

      {/* ── Export sales + grain stocks (self-hide when not tracked) ── */}
      <ExportSalesPanel commodity={commodity} commodityLabel={commodityLabel} />
      <GrainStocksPanel commodity={commodity} />

      {/* ── Quick links (crops only) ───────────────────────────── */}
      {!crushProduct && (
        <div className={styles.linkGrid}>
          <QuickLink
            href="/usda-reports"
            icon="🏛️"
            title="USDA Reports"
            desc="Adjust state-by-state yields, submit a guess, see the crowd average."
          />
          <QuickLink
            href="/cropprogress"
            icon="🌱"
            title="Crop Progress"
            desc="Weekly state-level % planted, emerged, harvested."
          />
          <QuickLink
            href="/usda-reports?report=NASS_YIELD"
            icon="📑"
            title="USDA Yield Lookup"
            desc="Historical yield by commodity, year, and class."
          />
          <QuickLink
            href="/forecast-change"
            icon="📈"
            title="Forecast Change"
            desc="Track how weather forecasts shift between refreshes."
          />
        </div>
      )}
    </div>
  );
}

/* ── Small presentational helpers ─────────────────────────────────────────── */

function Stat({
  label,
  value,
  unit,
  footnote,
  big,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  footnote?: string;
  big?: boolean;
  tone?: "up" | "down";
}) {
  const valueColor =
    tone === "up" ? "#1d4ed8" : tone === "down" ? "#b91c1c" : "#1a2e0f";
  return (
    <div className={`${styles.stat} ${big ? styles.statBig : ""}`}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} style={{ color: valueColor }}>
        {value}
        {unit && <span className={styles.statUnit}>{unit}</span>}
      </div>
      {footnote && <div className={styles.statFootnote}>{footnote}</div>}
    </div>
  );
}

function StageBar({
  label,
  nationalAvg,
  userVal,
}: {
  label: string;
  nationalAvg: number;
  userVal?: number;
}) {
  const natlPct = Math.max(0, Math.min(100, Math.round(nationalAvg)));
  const userPct =
    userVal != null ? Math.max(0, Math.min(100, Math.round(userVal))) : null;
  return (
    <div className={styles.stageCard}>
      <div className={styles.stageLabel}>{label}</div>
      <div className={styles.stageBars}>
        <div className={styles.stageBarRow}>
          <span className={styles.stageRowLabel}>US Avg</span>
          <div className={styles.stageBarTrack}>
            <div
              className={styles.stageBarFill}
              style={{ width: `${natlPct}%`, background: "#3d6b2a" }}
            />
          </div>
          <span className={styles.stageRowValue}>{natlPct}%</span>
        </div>
        {userPct != null && (
          <div className={styles.stageBarRow}>
            <span className={styles.stageRowLabel}>Your State</span>
            <div className={styles.stageBarTrack}>
              <div
                className={styles.stageBarFill}
                style={{ width: `${userPct}%`, background: "#a16207" }}
              />
            </div>
            <span className={styles.stageRowValue}>{userPct}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ChangePill({
  change,
  pct,
  compact,
}: {
  change: number | null;
  pct: number | null;
  compact?: boolean;
}) {
  if (change == null) return <span className={styles.changeFlat}>—</span>;
  const up = change > 0;
  const down = change < 0;
  const arrow = up ? "▲" : down ? "▼" : "—";
  const cls = up
    ? styles.changeUp
    : down
      ? styles.changeDown
      : styles.changeFlat;
  return (
    <span className={`${cls} ${compact ? styles.compact : ""}`}>
      {arrow} {Math.abs(change).toFixed(2)}
      {pct != null && !compact && (
        <span style={{ marginLeft: ".4rem", opacity: 0.85 }}>
          ({pct > 0 ? "+" : ""}
          {pct.toFixed(2)}%)
        </span>
      )}
    </span>
  );
}

/**
 * Calendar spreads between consecutive contracts (nearer − next-out). A positive
 * value is an inverse (front premium); negative is carry — the normal grain shape.
 */
function CalendarSpreads({ group }: { group: CommodityGroup }) {
  const cs = (group.contracts ?? []).filter((c) => c.last != null).slice(0, 6);
  if (cs.length < 2) return null;
  const spreads = cs.slice(0, -1).map((c, i) => ({
    label: `${c.expiration.split(" ")[0]}–${cs[i + 1].expiration.split(" ")[0]}`,
    val: (c.last as number) - (cs[i + 1].last as number),
  }));
  return (
    <div style={{ padding: ".5rem .9rem .8rem" }}>
      <div
        style={{
          fontFamily: "Lato, sans-serif",
          fontSize: ".64rem",
          textTransform: "uppercase",
          letterSpacing: ".05em",
          color: "#6a7a55",
          fontWeight: 700,
          margin: "0 0 .4rem",
        }}
      >
        Calendar spreads{" "}
        <span style={{ fontWeight: 400, textTransform: "none" }}>
          ({group.unit})
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem" }}>
        {spreads.map((s) => (
          <span
            key={s.label}
            style={{
              fontFamily: "Lato, sans-serif",
              fontSize: ".74rem",
              background: "#f4f0e8",
              border: "1px solid #e1dccc",
              borderRadius: 14,
              padding: ".2rem .6rem",
              color: "#33402a",
            }}
          >
            {s.label}{" "}
            <strong
              style={{ color: "#2c4a1e", fontVariantNumeric: "tabular-nums" }}
            >
              {s.val > 0 ? "+" : ""}
              {s.val.toFixed(2)}
            </strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className={styles.quickLink}>
      <span className={styles.quickIcon}>{icon}</span>
      <div>
        <div className={styles.quickTitle}>{title}</div>
        <div className={styles.quickDesc}>{desc}</div>
      </div>
    </Link>
  );
}
