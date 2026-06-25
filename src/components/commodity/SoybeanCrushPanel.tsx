'use client';

import { useEffect, useState } from 'react';
import { api, CommodityGroup, CommodityPrice } from '@/src/lib/api';
import { StatCard } from '@/src/components/energy/EnergyCharts';
import styles from './commodityDashboard.module.css';

// Board-crush yields per 60-lb bushel: ~44 lb meal (0.022 short ton) + ~11 lb oil.
const MEAL_PER_BU = 0.022;   // meal $/ton × this = $/bu
const OIL_PER_BU  = 0.11;    // oil ¢/lb × this = $/bu

function front(g?: CommodityGroup): CommodityPrice | null {
  return g?.contracts?.find(c => c.last != null) ?? null;
}
const shortExp = (e: string) => e.split(' ')[0];
const usd = (n: number) => `$${n.toFixed(2)}`;

/**
 * Soybean board crush margin — the gross processing margin per bushel implied by
 * the meal, oil, and soybean futures (nearby contracts):
 *   crush = meal($/ton)×0.022 + oil(¢/lb)×0.11 − soybeans($/bu)
 */
export default function SoybeanCrushPanel() {
  const [groups, setGroups] = useState<CommodityGroup[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getPrices().then(d => { if (!cancelled) setGroups(d); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!groups) return null;
  const bean = front(groups.find(g => g.name === 'Soybeans'));
  const meal = front(groups.find(g => g.name === 'Soybean Meal'));
  const oil  = front(groups.find(g => g.name === 'Soybean Oil'));
  if (!bean?.last || !meal?.last || !oil?.last) return null;

  const mealValue = meal.last * MEAL_PER_BU;
  const oilValue  = oil.last * OIL_PER_BU;
  const beanCost  = bean.last / 100;
  const crush     = mealValue + oilValue - beanCost;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <h2>Board Crush Margin</h2>
        <span style={{ marginLeft: 'auto', color: '#a8cc78', fontSize: '.75rem', fontFamily: 'Lato, sans-serif' }}>
          {shortExp(bean.expiration)} beans · {shortExp(meal.expiration)} meal · {shortExp(oil.expiration)} oil
        </span>
      </div>
      <div style={{ padding: '.7rem 1rem 1rem', fontFamily: 'Lato, sans-serif' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.7rem' }}>
          <StatCard label="Crush Margin" value={usd(crush)} unit="/bu"
            accent={crush >= 0 ? '#1a7f37' : '#b42318'} />
          <StatCard label="Meal Value" value={usd(mealValue)} unit="/bu" accent="#a16207" />
          <StatCard label="Oil Value" value={usd(oilValue)} unit="/bu" accent="#2563eb" />
          <StatCard label="Bean Cost" value={usd(beanCost)} unit="/bu" accent="#1a2e0f" />
        </div>
        <p style={{ margin: '.8rem 0 0', fontSize: '.7rem', color: '#999' }}>
          Gross board crush from nearby futures (meal&times;0.022 + oil&times;0.11 − beans). A wider margin
          rewards processors and supports crush demand for soybeans.
        </p>
      </div>
    </div>
  );
}
