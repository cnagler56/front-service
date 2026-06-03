'use client';

import { Listing, LISTING_CATEGORIES } from '@/src/lib/api';
import ContactLine from './ContactLine';
import styles from '@/src/styles/farm.module.css';

/** Single listing card — image (or category-icon fallback), badges, body, contact link. */
export default function ListingCard({ listing }: { listing: Listing }) {
  const cat = LISTING_CATEGORIES.find(c => c.value === listing.category);
  const catLabel = cat?.label ?? listing.category;
  const catIcon  = cat?.icon  ?? '📦';
  const isBuy = listing.type === 'BUY';

  return (
    <div className={styles.listingCard}>
      {listing.imageBase64 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={listing.imageBase64} alt={listing.title} className={styles.listingImage} />
      ) : (
        <div className={styles.listingImagePlaceholder}>{catIcon}</div>
      )}
      <div className={styles.listingBody}>
        <div className={styles.listingBadges}>
          <span className={`${styles.badge} ${isBuy ? styles.badgeBuy : styles.badgeSell}`}>
            {isBuy ? 'Want to Buy' : 'For Sale'}
          </span>
          <span className={`${styles.badge} ${styles.badgeCat}`}>{catIcon} {catLabel}</span>
        </div>
        <h3 className={styles.listingTitle}>{listing.title}</h3>
        <p className={styles.listingMeta}>
          {listing.name}{listing.city ? ` — ${listing.city},` : ' —'} {listing.state}
        </p>
        {(listing.price || listing.quantity) && (
          <p className={styles.listingPriceRow}>
            {listing.price    && <span className={styles.listingPrice}>{listing.price}</span>}
            {listing.quantity && <span className={styles.listingQty}>{listing.quantity}</span>}
          </p>
        )}
        <p className={styles.listingDesc}>{listing.description}</p>
        <ContactLine method={listing.contactMethod} value={listing.contactValue} />
      </div>
    </div>
  );
}
