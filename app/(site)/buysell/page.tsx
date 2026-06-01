'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  api,
  Listing,
  ListingType,
  ListingCategory,
  ContactMethod,
  User,
  LISTING_CATEGORIES,
  CONTACT_METHODS,
} from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

type TypeFilter = 'ALL' | ListingType;
type CategoryFilter = 'ALL' | ListingCategory;

/** Resize an image File on the client and return a data-URL JPEG (base64). */
async function fileToResizedDataUrl(
  file: File,
  maxDim = 1200,
  quality = 0.75,
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Could not load image'));
    i.src = dataUrl;
  });

  const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

export default function BuySellPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [catFilter,  setCatFilter]  = useState<CategoryFilter>('ALL');

  const [modalOpen, setModalOpen] = useState(false);

  const refresh = useCallback(
    (t: TypeFilter = typeFilter, c: CategoryFilter = catFilter) => {
      setLoading(true);
      api.getListings(t, c)
        .then(setListings)
        .catch(() => setError('Failed to load listings. Is the server running?'))
        .finally(() => setLoading(false));
    },
    [typeFilter, catFilter],
  );

  useEffect(() => { refresh(typeFilter, catFilter); }, [typeFilter, catFilter, refresh]);

  return (
    <div className={styles.page}>
      {error && <p className={styles.error}>{error}</p>}

      {/* ── Listings (top of page) ─────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeadRow}>
          <div className={styles.titleGroup}>
            <span>🛒</span>
            <h2>Buy / Sell Listings</h2>
          </div>
          <button className={styles.headerBtn} onClick={() => setModalOpen(true)}>
            + Add Listing
          </button>
        </div>

        <div className={styles.sectionBody}>
          <div className={styles.filterPills}>
            <div className={styles.filterGroup}>
              {(['ALL', 'BUY', 'SELL'] as TypeFilter[]).map(t => (
                <button
                  key={t}
                  className={`${styles.filterPill} ${typeFilter === t ? styles.filterPillActive : ''}`}
                  onClick={() => setTypeFilter(t)}
                >
                  {t === 'ALL' ? 'All' : t === 'BUY' ? 'Buying' : 'Selling'}
                </button>
              ))}
            </div>
            <div className={styles.filterGroup}>
              <button
                className={`${styles.filterPill} ${catFilter === 'ALL' ? styles.filterPillActive : ''}`}
                onClick={() => setCatFilter('ALL')}
              >
                All
              </button>
              {LISTING_CATEGORIES.map(c => (
                <button
                  key={c.value}
                  className={`${styles.filterPill} ${catFilter === c.value ? styles.filterPillActive : ''}`}
                  onClick={() => setCatFilter(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className={styles.loading}>Loading…</p>
          ) : listings.length === 0 ? (
            <p className={styles.empty}>
              No listings yet — click <strong>+ Add Listing</strong> to post the first one.
            </p>
          ) : (
            <div className={styles.listingGrid}>
              {listings.map(l => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <AddListingModal
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

/* ── Listing card ──────────────────────────────────────────────── */
function ListingCard({ listing }: { listing: Listing }) {
  const catLabel =
    LISTING_CATEGORIES.find(c => c.value === listing.category)?.label ?? listing.category;
  const catIcon =
    LISTING_CATEGORIES.find(c => c.value === listing.category)?.icon ?? '📦';
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
          <span className={`${styles.badge} ${listing.type === 'BUY' ? styles.badgeBuy : styles.badgeSell}`}>
            {listing.type === 'BUY' ? 'Want to Buy' : 'For Sale'}
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

function ContactLine({ method, value }: { method?: ContactMethod; value?: string }) {
  if (!method || !value) return null;
  const icon = method === 'EMAIL' ? '✉️' : method === 'TEXT' ? '💬' : '📞';
  const label = method === 'EMAIL' ? 'Email' : method === 'TEXT' ? 'Text' : 'Call';
  const href =
    method === 'EMAIL' ? `mailto:${value}`
    : method === 'TEXT'  ? `sms:${value}`
    : `tel:${value}`;
  return (
    <a className={styles.contactLine} href={href}>
      <span>{icon}</span>
      <span className={styles.contactLabel}>{label}:</span>
      <span className={styles.contactValue}>{value}</span>
    </a>
  );
}

/* ── Add Listing modal ────────────────────────────────────────── */
function AddListingModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [type, setType] = useState<ListingType>('SELL');
  const [category, setCategory] = useState<ListingCategory>('TRACTORS');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice]       = useState('');
  const [quantity, setQuantity] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [contactMethod, setContactMethod] = useState<ContactMethod>('PHONE');
  const [contactValue,  setContactValue]  = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Pull the logged-in user from localStorage when the modal opens
  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('agri_user') : null;
      if (stored) setUser(JSON.parse(stored) as User);
    } catch { /* ignore */ }
  }, []);

  const displayName =
    user?.name?.trim()
    || [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
    || user?.username
    || '';

  // Close on Escape, prevent background scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMsg('Please choose an image file.');
      return;
    }
    setImageBusy(true);
    setMsg('');
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setImageBase64(dataUrl);
    } catch {
      setMsg('Could not process that image.');
    } finally {
      setImageBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setMsg('Please sign in before posting a listing.');
      return;
    }
    setSubmitting(true);
    setMsg('');
    try {
      await api.addListing({
        type,
        category,
        title,
        description,
        name: displayName,
        city: user.city ?? '',
        state: user.state ?? '',
        price: price.trim() || undefined,
        quantity: quantity.trim() || undefined,
        imageBase64,
        contactMethod,
        contactValue: contactValue.trim(),
        userId: user.userId,
      });
      onCreated();
    } catch {
      setMsg('Failed to submit listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={styles.modalOverlay}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.modalCard}>
        <div className={styles.modalHead}>
          <h2>Post a Buy / Sell Listing</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className={styles.modalBody}>
          {msg && <p className={styles.error}>{msg}</p>}

          <form className={styles.modalForm} onSubmit={handleSubmit}>
            <div className={styles.formRowGroup}>
              <div className={styles.formRow}>
                <label>Type</label>
                <select value={type} onChange={e => setType(e.target.value as ListingType)} required>
                  <option value="SELL">Selling</option>
                  <option value="BUY">Looking to Buy</option>
                </select>
              </div>
              <div className={styles.formRow}>
                <label>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value as ListingCategory)} required>
                  {LISTING_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <label>Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={titleHint(category)}
                required
              />
            </div>

            <div className={styles.formRowGroup}>
              <div className={styles.formRow}>
                <label>Price (optional)</label>
                <input
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder={priceHint(category)}
                />
              </div>
              <div className={styles.formRow}>
                <label>Quantity (optional)</label>
                <input
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder={qtyHint(category)}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <label>Details</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={detailsHint(category)}
                required
              />
            </div>

            <div className={styles.formRow}>
              <label>Photo (optional)</label>
              {imageBase64 ? (
                <div className={styles.imagePreviewWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageBase64} alt="preview" className={styles.imagePreview} />
                  <button
                    type="button"
                    className={styles.imageRemove}
                    onClick={() => setImageBase64(null)}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className={styles.fileDrop}>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFile}
                    disabled={imageBusy}
                  />
                  <p className={styles.fileDropHint}>
                    {imageBusy ? 'Processing image…' : '📷 Click to upload a photo'}
                  </p>
                </label>
              )}
            </div>

            <div className={styles.postingAs}>
              {user ? (
                <>
                  <span className={styles.postingAsLabel}>Posting as</span>
                  <strong>{displayName || 'Unnamed user'}</strong>
                  <span className={styles.postingAsLoc}>
                    {[user.city, user.state].filter(Boolean).join(', ') || 'No location on file'}
                  </span>
                </>
              ) : (
                <span className={styles.error}>
                  You must be signed in to post a listing.
                </span>
              )}
            </div>

            <div className={styles.formRowGroup}>
              <div className={styles.formRow} style={{ flex: '0 0 140px' }}>
                <label>Contact By</label>
                <select
                  value={contactMethod}
                  onChange={e => setContactMethod(e.target.value as ContactMethod)}
                  required
                >
                  {CONTACT_METHODS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formRow}>
                <label>{contactMethod === 'EMAIL' ? 'Email Address' : 'Phone Number'}</label>
                <input
                  type={contactMethod === 'EMAIL' ? 'email' : 'tel'}
                  value={contactValue}
                  onChange={e => setContactValue(e.target.value)}
                  placeholder={contactMethod === 'EMAIL' ? 'you@example.com' : '(555) 123-4567'}
                  required
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.btnSecondary} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className={styles.btn} disabled={submitting || imageBusy || !user}>
                {submitting ? 'Posting…' : 'Post Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Per-category placeholder hints ─────────────────────────────── */

function titleHint(c: ListingCategory): string {
  switch (c) {
    case 'TRACTORS':  return 'e.g. John Deere 4020 — runs strong';
    case 'COMBINES':  return 'e.g. Case IH 2388 with corn head';
    case 'EQUIPMENT': return 'e.g. 24-row planter, low acres';
    case 'HAY':       return 'e.g. 1st cutting alfalfa, 4x5 round bales';
    case 'LIVESTOCK': return 'e.g. 50 Angus feeder calves, weaned';
    case 'SERVICES':  return 'e.g. Custom combining — corn & beans';
    default:          return 'Short description of what you have / want';
  }
}

function priceHint(c: ListingCategory): string {
  switch (c) {
    case 'HAY':       return '$8/bale or $200/ton';
    case 'LIVESTOCK': return '$1.85/lb or $1,200/head';
    case 'SERVICES':  return '$45/acre or $125/hour';
    default:          return '$25,000';
  }
}

function qtyHint(c: ListingCategory): string {
  switch (c) {
    case 'HAY':       return '500 bales or 120 tons';
    case 'LIVESTOCK': return '50 head, avg 650 lbs';
    case 'SERVICES':  return 'Up to 2,000 acres';
    default:          return '';
  }
}

function detailsHint(c: ListingCategory): string {
  switch (c) {
    case 'TRACTORS':  return 'Year, hours, condition, tires, attachments, location…';
    case 'COMBINES':  return 'Year, separator hours, engine hours, heads included…';
    case 'EQUIPMENT': return 'Year, condition, hours/acres, any wear items replaced…';
    case 'HAY':       return 'Cutting, variety (alfalfa / grass / mix), test results, storage…';
    case 'LIVESTOCK': return 'Breed, age, weight range, vaccinations, weaned date…';
    case 'SERVICES':  return 'Service area, equipment used, availability, minimum acres…';
    default:          return 'Describe what you have or what you\'re looking for.';
  }
}
