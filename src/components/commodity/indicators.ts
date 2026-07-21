/**
 * Technical indicators computed from daily OHLC bars, for the futures chart.
 * Each returns points aligned to bar time (epoch seconds); the series simply
 * starts where the indicator becomes valid — lightweight-charts wants ascending
 * time with no gaps in a given series, so we omit the leading warm-up bars.
 */
import type { FuturesBar } from '@/src/lib/api';

export interface Point { time: number; value: number }

/** Simple moving average of closes over `period`. */
export function sma(bars: FuturesBar[], period: number): Point[] {
  const out: Point[] = [];
  let sum = 0;
  for (let i = 0; i < bars.length; i++) {
    sum += bars[i].c;
    if (i >= period) sum -= bars[i - period].c;
    if (i >= period - 1) out.push({ time: bars[i].t, value: round(sum / period) });
  }
  return out;
}

/** Wilder's RSI over `period` (default 14). */
export function rsi(bars: FuturesBar[], period = 14): Point[] {
  const out: Point[] = [];
  if (bars.length <= period) return out;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = bars[i].c - bars[i - 1].c;
    if (d >= 0) avgGain += d; else avgLoss -= d;
  }
  avgGain /= period; avgLoss /= period;
  out.push({ time: bars[period].t, value: rsiVal(avgGain, avgLoss) });
  for (let i = period + 1; i < bars.length; i++) {
    const d = bars[i].c - bars[i - 1].c;
    const gain = d > 0 ? d : 0, loss = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out.push({ time: bars[i].t, value: rsiVal(avgGain, avgLoss) });
  }
  return out;
}
function rsiVal(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return round(100 - 100 / (1 + rs));
}

/** Money Flow Index over `period` (default 14). */
export function mfi(bars: FuturesBar[], period = 14): Point[] {
  const out: Point[] = [];
  if (bars.length <= period) return out;
  const tp = bars.map(b => (b.h + b.l + b.c) / 3);
  const rmf = bars.map((b, i) => tp[i] * b.v);
  for (let i = period; i < bars.length; i++) {
    let pos = 0, neg = 0;
    for (let k = i - period + 1; k <= i; k++) {
      if (tp[k] > tp[k - 1]) pos += rmf[k];
      else if (tp[k] < tp[k - 1]) neg += rmf[k];
    }
    const value = neg === 0 ? 100 : round(100 - 100 / (1 + pos / neg));
    out.push({ time: bars[i].t, value });
  }
  return out;
}

/**
 * Slow stochastic (14, 3, 3): raw %K over 14, smoothed by 3 → %K line; %D = 3-SMA of that.
 */
export function stochastic(bars: FuturesBar[], kPeriod = 14, kSmooth = 3, dSmooth = 3): { k: Point[]; d: Point[] } {
  const rawK: Point[] = [];
  for (let i = kPeriod - 1; i < bars.length; i++) {
    let hi = -Infinity, lo = Infinity;
    for (let k = i - kPeriod + 1; k <= i; k++) { hi = Math.max(hi, bars[k].h); lo = Math.min(lo, bars[k].l); }
    const range = hi - lo;
    rawK.push({ time: bars[i].t, value: range === 0 ? 50 : round(((bars[i].c - lo) / range) * 100) });
  }
  const k = smaPoints(rawK, kSmooth);
  const d = smaPoints(k, dSmooth);
  return { k, d };
}

/** SMA over an existing point series (used to smooth %K / %D). */
function smaPoints(points: Point[], period: number): Point[] {
  const out: Point[] = [];
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    sum += points[i].value;
    if (i >= period) sum -= points[i - period].value;
    if (i >= period - 1) out.push({ time: points[i].time, value: round(sum / period) });
  }
  return out;
}

function round(v: number): number { return Math.round(v * 100) / 100; }
