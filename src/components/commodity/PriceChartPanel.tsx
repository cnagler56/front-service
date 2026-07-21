'use client';

import { useEffect, useRef } from 'react';
import styles from './commodityDashboard.module.css';

/**
 * Interactive futures price chart — the same TradingView Advanced Chart that
 * CME's own site embeds ("powered by TradingView"), pointed at the CBOT/ICE
 * front-month contract for this commodity. Candlesticks + volume with the
 * lower-panel oscillators from the classic setup (MFI, Stochastic, RSI) and a
 * moving average; fully interactive, so viewers can change timeframe, add the
 * 20/50/200 SMAs, or switch contracts from the toolbar.
 *
 * Data is exchange-delayed on the free widget (real-time needs the viewer's
 * own TradingView login). TradingView's terms require keeping their
 * attribution link, which we render below the chart.
 */

/** Site commodity code → TradingView continuous front-month symbol. */
const TV_SYMBOL: Record<string, string> = {
  CORN: 'CBOT:ZC1!',
  SOYBEANS: 'CBOT:ZS1!',
  SOYBEAN_MEAL: 'CBOT:ZM1!',
  SOYBEAN_OIL: 'CBOT:ZL1!',
  WHEAT: 'CBOT:ZW1!',
  COTTON: 'ICEUS:CT1!',
};

const STUDIES = [
  'MASimple@tv-basicstudies',
  'MF@tv-basicstudies',
  'Stochastic@tv-basicstudies',
  'RSI@tv-basicstudies',
];

interface Props {
  commodity: string;
  commodityLabel: string;
  /** Override the auto-mapped TradingView symbol if needed. */
  tvSymbol?: string;
}

export default function PriceChartPanel({ commodity, commodityLabel, tvSymbol }: Props) {
  const symbol = tvSymbol ?? TV_SYMBOL[commodity.toUpperCase()];
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = holder.current;
    if (!el || !symbol) return;

    // Rebuild the widget container fresh (TradingView's script reads its
    // sibling <div> and appends an iframe; we recreate on symbol change).
    el.innerHTML = '';
    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    widget.style.height = 'calc(100% - 32px)';
    widget.style.width = '100%';
    el.appendChild(widget);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: 'D',
      timezone: 'America/Chicago',
      theme: 'light',
      style: '1',            // candles
      locale: 'en',
      withdateranges: true,
      allow_symbol_change: true,
      hide_side_toolbar: false,
      studies: STUDIES,
      support_host: 'https://www.tradingview.com',
    });
    el.appendChild(script);

    return () => { el.innerHTML = ''; };
  }, [symbol]);

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <h2>{commodityLabel} Futures — Price Chart</h2>
      </div>
      <div style={{ padding: '1rem 1.1rem 1.1rem' }}>
        {!symbol ? (
          <p className={styles.empty}>No futures chart is configured for this product.</p>
        ) : (
          <>
            <div
              ref={holder}
              className="tradingview-widget-container"
              style={{ height: 520, width: '100%' }}
            />
            <p style={{ margin: '.6rem 0 0', fontSize: '.72rem', color: '#8a9678', fontFamily: 'Lato, sans-serif', lineHeight: 1.5 }}>
              Chart by{' '}
              <a href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#3d6b2a', fontWeight: 700 }}>
                TradingView
              </a>{' '}
              · CBOT/CME data, exchange-delayed. Use the chart toolbar to change the
              timeframe, switch contracts, or add indicators (e.g. 20/50/200-day moving averages).
            </p>
          </>
        )}
      </div>
    </div>
  );
}
