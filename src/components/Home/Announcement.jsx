'use client';
import React, { useEffect, useState } from "react";
import { api } from "@/src/lib/api";
import styles from "./Home.module.css";

/**
 * Admin-editable announcement bento. Renders nothing unless the server returns
 * an active announcement with content, so the home page is unchanged when
 * there's nothing to say. Edited from the admin page — no redeploy needed.
 */
const Announcement = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.getAnnouncement()
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData(null); });
    return () => { cancelled = true; };
  }, []);

  const title = data?.title?.trim();
  const body = data?.body?.trim();
  if (!data?.active || (!title && !body)) return null;

  return (
    <section className={styles.farmSection} style={{ borderColor: '#b7c6d4' }}>
      <div className={styles.farmSectionHeader} style={{ background: 'linear-gradient(135deg, #34536e, #4a6f93)', borderBottom: '2px solid #7ea6c9' }}>
        <h2>{title || 'Announcement'}</h2>
      </div>
      {body && (
        <div
          className={styles.farmSectionBody}
          style={{ display: 'block', whiteSpace: 'pre-wrap', color: '#1f2933', fontWeight: 400, fontSize: '1rem', lineHeight: 1.7 }}
        >
          {body}
        </div>
      )}
    </section>
  );
};

export default Announcement;
