'use client';

import { ContactMethod } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

/**
 * The little green pill at the bottom of a listing card with a clickable
 * tel: / sms: / mailto: link. Returns null if there's no contact info
 * so the card doesn't render an empty placeholder.
 */
export default function ContactLine({
  method, value,
}: { method?: ContactMethod; value?: string }) {
  if (!method || !value) return null;
  const icon  = method === 'EMAIL' ? '✉️' : method === 'TEXT' ? '💬' : '📞';
  const label = method === 'EMAIL' ? 'Email' : method === 'TEXT' ? 'Text' : 'Call';
  const href  = method === 'EMAIL' ? `mailto:${value}`
              : method === 'TEXT'  ? `sms:${value}`
              :                      `tel:${value}`;
  return (
    <a className={styles.contactLine} href={href}>
      <span>{icon}</span>
      <span className={styles.contactLabel}>{label}:</span>
      <span className={styles.contactValue}>{value}</span>
    </a>
  );
}
