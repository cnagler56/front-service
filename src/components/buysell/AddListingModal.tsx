'use client';

import { useEffect, useRef, useState } from 'react';
import {
  api, User,
  ListingType, ListingCategory, ContactMethod,
  LISTING_CATEGORIES, CONTACT_METHODS,
} from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';
import { fileToResizedDataUrl } from './imageResize';
import { titleHint, priceHint, qtyHint, detailsHint } from './listingHints';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

/** Full-screen modal for posting a new buy/sell listing. */
export default function AddListingModal({ onClose, onCreated }: Props) {
  const [type, setType]                 = useState<ListingType>('SELL');
  const [category, setCategory]         = useState<ListingCategory>('TRACTORS');
  const [title, setTitle]               = useState('');
  const [description, setDescription]   = useState('');
  const [price, setPrice]               = useState('');
  const [quantity, setQuantity]         = useState('');
  const [imageBase64, setImageBase64]   = useState<string | null>(null);
  const [imageBusy, setImageBusy]       = useState(false);
  const [contactMethod, setContactMethod] = useState<ContactMethod>('PHONE');
  const [contactValue,  setContactValue]  = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [msg, setMsg]                   = useState('');
  const [user, setUser]                 = useState<User | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Pull the logged-in user from localStorage when the modal opens
  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('agri_user') : null;
      if (stored) setUser(JSON.parse(stored) as User);
    } catch { /* ignore */ }
  }, []);

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

  const displayName =
    user?.name?.trim()
    || [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
    || user?.username
    || '';

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
      setImageBase64(await fileToResizedDataUrl(file));
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
        type, category, title, description,
        name:  displayName,
        city:  user.city  ?? '',
        state: user.state ?? '',
        price:    price.trim()    || undefined,
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
                <input value={price} onChange={e => setPrice(e.target.value)} placeholder={priceHint(category)} />
              </div>
              <div className={styles.formRow}>
                <label>Quantity (optional)</label>
                <input value={quantity} onChange={e => setQuantity(e.target.value)} placeholder={qtyHint(category)} />
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
                  <button type="button" className={styles.imageRemove} onClick={() => setImageBase64(null)}>
                    Remove
                  </button>
                </div>
              ) : (
                <label className={styles.fileDrop}>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} disabled={imageBusy} />
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
                <span className={styles.error}>You must be signed in to post a listing.</span>
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
              <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancel</button>
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
