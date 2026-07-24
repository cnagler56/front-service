'use client';

import { useEffect, useRef, useState } from 'react';
import { api, FuturesHistory } from '@/src/lib/api';
import { sma, rsi, mfi, stochastic } from './indicators';
import styles from './commodityDashboard.module.css';

/**
 * Our own daily candlestick chart for a commodity's front-month futures,
 * rendered from backend OHLC with TradingView's free Lightweight Charts
 * library — so it shows the actual CBOT contract (unlike the embed widget,
 * which can't serve futures data). Panes: price + SMA 20/50/200 + volume,
 * then MFI, Stochastic (14,3,3), and RSI, matching the classic setup.
 */

const SMA_LINES = [
  { period: 20, color: '#2c7fb8' },
  { period: 50, color: '#e0a52e' },
  { period: 200, color: '#8e44ad' },
];

interface Props {
  commodity: string;
  commodityLabel: string;
}

export default function FuturesChart({ commodity, commodityLabel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<FuturesHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    setData(null);
    api.getFuturesHistory(commodity)
      .then(d => { if (live) setData(d); })
      .catch(() => { if (live) setError('Could not load price history.'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [commodity]);

  useEffect(() => {
    const bars = data?.bars;
    const el = containerRef.current;
    if (!bars || bars.length === 0 || !el) return;

    let disposed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let chart: any = null;

    (async () => {
      const LWC = await import('lightweight-charts');
      if (disposed || !containerRef.current) return;
      const { createChart, CandlestickSeries, HistogramSeries, LineSeries, LineStyle } = LWC;

      chart = createChart(containerRef.current, {
        autoSize: true,
        layout: { background: { color: '#ffffff' }, textColor: '#33402a', fontFamily: 'Lato, sans-serif', attributionLogo: false },
        grid: { vertLines: { color: '#f2ece1' }, horzLines: { color: '#f2ece1' } },
        rightPriceScale: { borderColor: '#e1dccc' },
        timeScale: { borderColor: '#e1dccc', rightOffset: 4 },
        crosshair: { mode: 1 },
      });

      const candleData = bars.map(b => ({ time: b.t as never, open: b.o, high: b.h, low: b.l, close: b.c }));

      // Price pane (0): candles
      const candle = chart.addSeries(CandlestickSeries, {
        upColor: '#2e8b57', downColor: '#c0392b', borderVisible: false,
        wickUpColor: '#2e8b57', wickDownColor: '#c0392b',
        priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
      });
      candle.setData(candleData);

      // Moving averages (overlay on price pane)
      for (const { period, color } of SMA_LINES) {
        const s = chart.addSeries(LineSeries, {
          color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
        }, 0);
        s.setData(sma(bars, period) as never);
      }

      // Volume (overlay at the bottom of the price pane)
      const vol = chart.addSeries(HistogramSeries, {
        priceScaleId: '', priceFormat: { type: 'volume' },
      }, 0);
      vol.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
      vol.setData(bars.map(b => ({
        time: b.t as never, value: b.v,
        color: b.c >= b.o ? 'rgba(46,139,87,0.35)' : 'rgba(192,57,46,0.35)',
      })));

      // MFI pane (1)
      const mfiSeries = chart.addSeries(LineSeries, { color: '#6a3d9a', lineWidth: 1, priceLineVisible: false }, 1);
      mfiSeries.setData(mfi(bars) as never);
      band(mfiSeries, 80, 20, LineStyle.Dashed);

      // Stochastic pane (2): %K + %D
      const st = stochastic(bars);
      const kS = chart.addSeries(LineSeries, { color: '#1f77b4', lineWidth: 1, priceLineVisible: false }, 2);
      kS.setData(st.k as never);
      const dS = chart.addSeries(LineSeries, { color: '#e0872e', lineWidth: 1, priceLineVisible: false, lastValueVisible: false }, 2);
      dS.setData(st.d as never);
      band(kS, 80, 20, LineStyle.Dashed);

      // RSI pane (3)
      const rsiSeries = chart.addSeries(LineSeries, { color: '#7a3fa0', lineWidth: 1, priceLineVisible: false }, 3);
      rsiSeries.setData(rsi(bars) as never);
      band(rsiSeries, 70, 30, LineStyle.Dashed);

      // Give the price pane most of the height.
      const panes = chart.panes();
      if (panes[0]) panes[0].setStretchFactor(4);

      chart.timeScale().fitContent();

      function band(series: unknown, hi: number, lo: number, style: number) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = series as any;
        for (const price of [hi, lo]) {
          s.createPriceLine({ price, color: '#cfc9ba', lineWidth: 1, lineStyle: style, axisLabelVisible: false });
        }
      }
    })();

    return () => { disposed = true; if (chart) chart.remove(); };
  }, [data]);

  const cur = data?.currency === 'USX' ? '¢' : data?.currency === 'USD' ? '$' : '';
  const latest = data?.bars?.[data.bars.length - 1];

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <h2>{commodityLabel} Futures — Price Chart</h2>
        {data?.symbol && (
          <span style={{ marginLeft: 'auto', color: '#a8cc78', fontSize: '.74rem', fontFamily: 'Lato, sans-serif' }}>
            {data.symbol}{latest ? ` · ${cur}${latest.c.toFixed(2)}` : ''}
          </span>
        )}
      </div>
      <div style={{ padding: '1rem 1.1rem 1.1rem' }}>
        {loading && <p className={styles.loading}>Loading price chart…</p>}
        {error && !loading && <p className={styles.error}>{error}</p>}
        {!loading && !error && (!data?.bars || data.bars.length === 0) && (
          <p className={styles.empty}>{data?.message ?? 'No price history yet.'}</p>
        )}
        {!loading && !error && data?.bars && data.bars.length > 0 && (
          <>
            <div ref={containerRef} style={{ width: '100%', height: 560 }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', margin: '.55rem 0 0', fontFamily: 'Lato, sans-serif', fontSize: '.72rem', color: '#7a8a65' }}>
              <span><span style={{ color: '#2c7fb8', fontWeight: 700 }}>—</span> SMA 20</span>
              <span><span style={{ color: '#e0a52e', fontWeight: 700 }}>—</span> SMA 50</span>
              <span><span style={{ color: '#8e44ad', fontWeight: 700 }}>—</span> SMA 200</span>
              <span>Panels below: MFI · Stochastic 14 3 3 · RSI 14</span>
            </div>
            <p style={{ margin: '.5rem 0 0', fontSize: '.7rem', color: '#999', fontFamily: 'Lato, sans-serif' }}>
              Front-month {commodityLabel.toLowerCase()} futures, daily. Data via Yahoo Finance, in {cur === '¢' ? 'cents' : 'dollars'} —
              refreshed weekly{data?.updatedAt ? ` (last ${data.updatedAt.slice(0, 10)})` : ''}. Charting by
              TradingView Lightweight Charts.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
