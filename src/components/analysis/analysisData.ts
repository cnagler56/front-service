/**
 * Structured content for the flagship Analysis ("Situation Room") page.
 *
 * For now this is the current week's report, organized as typed data so the
 * page can present it richly (bias board, per-market charts + commentary,
 * intel tiles). Later this shape is what the analyst's publishing flow will
 * populate — the presentation layer won't change.
 */

export type Bias = 'buy' | 'sell' | 'neutral';

export interface Level {
  label: string;
  value: string;
}

export interface MarketCall {
  /** Futures code understood by <FuturesChart>; omit if we have no chart for it. */
  chartKey?: string;
  label: string;
  /**
   * The EXPLICIT call. Only 'buy'/'sell' when the analyst literally says the
   * market is in (or has moved to) a buy/sell environment. "Moving to" or
   * "nearing" a sell environment is NOT explicit — that stays 'neutral'.
   */
  bias: Bias;
  /**
   * Optional directional tilt for markets the analyst says are *heading* toward
   * a bias without being there yet. Used only to subtly shade the pill — it
   * never changes the Buy/Sell/Neutral label.
   */
  lean?: 'bullish' | 'bearish';
  /** One-line stance shown under the name. */
  headline: string;
  /** Markdown detail rendered under the chart / in the note. */
  commentary: string;
  /** Optional key-level chips. */
  levels?: Level[];
}

export interface Sector {
  id: string;
  name: string;
  blurb: string;
  markets: MarketCall[];
}

export interface IntelTile {
  id: string;
  title: string;
  icon: string;
  tone: Bias | 'info';
  /** Markdown body. */
  body: string;
}

export interface AnalysisReport {
  title: string;
  edition: string;
  date: string;
  author: string;
  bottomLine: string;
  sectors: Sector[];
  intel: IntelTile[];
}

export const BIAS_LABEL: Record<Bias, string> = { buy: 'Buy', sell: 'Sell', neutral: 'Neutral' };

/** All market calls flattened — used by the bias board + tally. */
export function allCalls(r: AnalysisReport): MarketCall[] {
  return r.sectors.flatMap(s => s.markets);
}

export function biasTally(r: AnalysisReport): Record<Bias, number> {
  const t: Record<Bias, number> = { buy: 0, sell: 0, neutral: 0 };
  for (const c of allCalls(r)) t[c.bias]++;
  return t;
}

export const REPORT: AnalysisReport = {
  title: 'Weekly Situational Awareness',
  edition: 'The Situation Report',
  date: 'July 17, 2026',
  author: 'Michael Kvistad',
  bottomLine:
    'The grains and oilseeds have rallied out of their bearish phase and are moving into a sell environment — corn, soybeans, soybean oil and all three wheats. The rally is drawing out old-crop producer selling, which caps further upside. Livestock has turned: live cattle are a buy. Weather is a neutral-to-bearish price factor — heat, but near-normal rain and no drought threat.',

  sectors: [
    {
      id: 'grains',
      name: 'Grains and Oilseeds',
      blurb: 'Rallied out of the bearish phase — now nearing sell environments as producer selling builds.',
      markets: [
        {
          chartKey: 'CORN', label: 'Corn', bias: 'neutral', lean: 'bearish',
          headline: 'Nearing a sell environment above the 200-day',
          levels: [
            { label: 'Resistance', value: '200 & 50-day' },
            { label: 'Upside', value: '~$4.80' },
            { label: 'Gaps', value: 'None' },
          ],
          commentary:
            'A month ago the market had **"exhausted much of its bearish price momentum."** The rally has since moved through the 20-day and addressed 200 & 50-day resistance.\n\nConsecutive closes above the 200-day could lift toward **~$4.80** — but that is likely the *last leg* before a sell environment and a reversal lower. Not in the "U.S. weather issue" camp. No price gaps to attract price short term.',
        },
        {
          chartKey: 'SOYBEANS', label: 'Soybeans', bias: 'neutral', lean: 'bearish',
          headline: 'Challenging June highs; watch for a reversal lower',
          levels: [
            { label: 'Testing', value: 'June highs' },
            { label: 'Long-term', value: 'Bearish' },
          ],
          commentary:
            'Rallied as anticipated and is now challenging the June highs. **Moving to a sell environment** — looking for a reversal pattern lower to confirm the rally is done.\n\nIf the 20-day trades through the 50-day, the reversal may be delayed but not cancelled. The rally is drawing additional old-crop producer selling, which should cover old-crop demand comfortably. Longer-term bias stays **bearish** until the market says otherwise.',
        },
        {
          chartKey: 'SOYBEAN_OIL', label: 'Soybean Oil', bias: 'neutral', lean: 'bearish',
          headline: 'Moving to a sell environment; near overbought',
          levels: [{ label: 'Resistance', value: 'Prior highs' }, { label: 'Momentum', value: 'Near overbought' }],
          commentary:
            'Moving to a sell environment: close to overbought and sitting **just below major resistance** at the previous price highs.',
        },
        {
          chartKey: 'SOYBEAN_MEAL', label: 'Soybean Meal', bias: 'neutral',
          headline: 'Room to run, but not bullish longer term',
          levels: [{ label: 'Watch', value: 'Overbought alert' }],
          commentary:
            'Still has time and room to move a bit higher before an overbought alert. **Not bullish longer term** — stay alert for the overbought bias and a reversal pattern to signal the rally has run its course.',
        },
        {
          chartKey: 'WHEAT', label: 'Wheat — SRW / HRW / Spring', bias: 'sell',
          headline: 'Overbought; shooting-star reversal. Short bias',
          levels: [
            { label: 'Signal', value: 'Shooting star (Thu)' },
            { label: 'Downside', value: '$0.50–$0.60' },
            { label: 'Position', value: 'Short all wheats' },
          ],
          commentary:
            'Now a **sell** environment. The rally extended into overbought and the winter wheats printed a **shooting-star reversal on Thursday**. Thursday\'s highs must be taken out on a confirmed basis to negate that.\n\nNot bullish wheat at this time or price. If forced to hold a position, would be **short all wheats**; a **$0.50–$0.60** decline in the coming weeks would not be a surprise.\n\n> Russian export worries are a *logistics* story, not production loss — not going down that rabbit hole.',
        },
      ],
    },
    {
      id: 'livestock',
      name: 'Livestock',
      blurb: 'The turn is in — cattle have moved from oversold decline to a buy.',
      markets: [
        {
          chartKey: 'LIVE_CATTLE', label: 'Live Cattle', bias: 'buy',
          headline: 'Meaningfully oversold; reversal higher expected this week',
          levels: [
            { label: 'Condition', value: 'Deeply oversold' },
            { label: 'Vs 200-day', value: 'Below, stretched' },
          ],
          commentary:
            'Now a **buy** environment. Meaningfully oversold, price is too far below the shorter-term moving averages, and the decline has been very vertical.\n\nExpecting a **reversal-higher pattern to develop this week**. The recent decline let the market address many of the bearish fundamentals present three weeks ago.',
        },
      ],
    },
    {
      id: 'energy',
      name: 'Energy',
      blurb: 'Crude has done its short-term job; natural gas turns up on a structural demand story.',
      markets: [
        {
          label: 'Crude Oil', bias: 'neutral', lean: 'bearish',
          headline: 'Gap filled in low $80s; now looking for a sell signal',
          levels: [{ label: 'Gap', value: 'Filled (low $80s)' }, { label: 'Watch', value: 'Sell signal ~10 days' }],
          commentary:
            'Rallied to fill the mid-June gap in the low **$80s** and has now done what it needed to do short term. Looking for a **sell signal in the coming ~10 days**. Price action beats headlines here — the recent MOU noise only confirmed what price had already said.',
        },
        {
          label: 'Natural Gas', bias: 'buy',
          headline: 'Moved to a buy environment',
          levels: [{ label: 'Tailwind', value: 'Data-center demand' }],
          commentary:
            'Has moved to a **buy** environment. Longer term, the data-center buildout is projected to consume massive power — **nat gas and nuclear** should lead the supply, reshaping energy demand flows.',
        },
      ],
    },
    {
      id: 'equities',
      name: 'Equities',
      blurb: 'Still bullish long term, but stretched at highs and due a breather.',
      markets: [
        {
          label: 'E-Mini Dow', bias: 'neutral',
          headline: 'Bullish long term, but a short-term breather is warranted',
          levels: [{ label: 'Signal', value: 'Shooting star' }, { label: 'Risk', value: 'Not oversold' }],
          commentary:
            'Needs a modest breather after new highs — vulnerable because it is not oversold and sits just on top of moving-average support. Still **bullish longer term**; a modest, not major, pullback is the base case.',
        },
        {
          label: 'E-Mini Nasdaq', bias: 'neutral',
          headline: 'Sideways; more of the same expected',
          commentary:
            'Sideways price action, with more of the same expected in the short term. Broadly still constructive on equities long term, but wouldn\'t be surprised to see some of the recent rally given back near historical highs.',
        },
      ],
    },
    {
      id: 'macro',
      name: 'Currencies and Crypto',
      blurb: 'Dollar in a sell environment but supported; respect Bitcoin\'s reversal, not yet a buy.',
      markets: [
        {
          label: 'U.S. Dollar Index', bias: 'neutral', lean: 'bearish',
          headline: 'Found short-term support after moving to a sell environment',
          levels: [{ label: 'Pattern', value: 'Three black crows' }, { label: 'Now', value: 'Short-term support' }],
          commentary:
            'In a **sell** environment after a "three black crows" top, but has now **found short-term support**. Still the global reserve currency; recent geopolitical strength versus China, Russia and the Middle East is reflected in the firmer index.',
        },
        {
          label: 'Bitcoin', bias: 'neutral', lean: 'bullish',
          headline: 'Respect the reversal higher; not yet a clear buy',
          levels: [{ label: 'Pattern', value: 'Reversal higher' }],
          commentary:
            'Completed a **reversal pattern higher** (three white soldiers) early last week. Respect the pattern — don\'t approach Bitcoin with a bearish bias short term — but **not yet comfortable calling it a buy.**',
        },
      ],
    },
  ],

  intel: [
    {
      id: 'weather', title: 'Weather', icon: '🌤️', tone: 'sell',
      body:
        'Some are making a story of next week\'s heat across the western and northern Corn Belt. **Not in that camp:** it will be warm, but most areas also see **near-normal precipitation** — light rain, but not a drought setup.\n\nProduction technology carries crops through limited stress, and enough of the crop is far enough into its cycle to rule out meaningful loss. Global weather (France dryness aside) shows no trend threatening production.\n\n**Net: weather is a neutral-to-bearish price factor.**',
    },
    {
      id: 'logistics', title: 'Transportation and Export Demand', icon: '🚂', tone: 'info',
      body:
        '- **Rail** — near-term freight on the low end; new-crop values structured to build a carry. Own new-crop freight only to match new-crop cash ownership.\n- **Barge** — little changed; nearby shuttle values near limited downside. A shrinking, un-replaced barge fleet is a genuine **mega-trend** lifting transport costs.\n- **Fuel** — surcharges high but already in cash bids; the crude decline should ease them on a lag.\n- **Exports** — outstanding sales trending lower (~20.6 MMT: corn 13.2, beans 3.1, wheat 4.4). New-crop bean sales to China are on schedule — expected, not a game-changer.\n- **Positioning** — funds net buyers of grains/oilseeds; commercial shorts building as producers sell the rally.',
    },
    {
      id: 'bigpicture', title: 'The Big Picture', icon: '🧭', tone: 'info',
      body:
        'We\'re in one of the most meaningful **structural-change** periods in decades — driven by a sustained lower price environment, industry age demographics, transportation consolidation, and the globalization of production.\n\nExpect fewer and larger operators, more vertical integration with demand, and technology cost spread over scale. The takeaway for clients: **understanding how price works is the edge** — far more than re-reading already-realized USDA data.',
    },
  ],
};
