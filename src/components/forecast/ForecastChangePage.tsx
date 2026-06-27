"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ForecastLocation } from "@/src/lib/api";
import { useUser } from "@/src/lib/UserContext";
import styles from "@/src/styles/farm.module.css";
import ForecastLocationModal from "./ForecastLocationModal";
import LocationsGrid from "./LocationsGrid";
import { useForecastLocations } from "./useForecastLocations";

/** Pull the 2-letter state from a "City, ST" name; '' if none. */
function parseState(name: string): string {
  const parts = name.split(",");
  if (parts.length < 2) return "";
  return parts[parts.length - 1].trim().toUpperCase();
}

/**
 * /forecast-change top — owns whether the add/edit modal is open. The
 * locations themselves (load + save + delete) live in useForecastLocations.
 */
export default function ForecastChangePage() {
  const { locations, loading, error, save, remove, refreshAll } =
    useForecastLocations();
  const { user } = useUser();
  const isAdmin = user?.roles === "ADMIN";
  const [modal, setModal] = useState<{
    open: boolean;
    editing: ForecastLocation | null;
  }>({ open: false, editing: null });
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefreshAll() {
    setRefreshing(true);
    try {
      await refreshAll();
    } catch {
      alert(
        "Refresh failed — check that you are signed in as an admin and the server is running.",
      );
    } finally {
      setRefreshing(false);
    }
  }

  // Filter locations by state.
  const [stateFilter, setStateFilter] = useState("ALL");

  // Distinct states actually present, for the dropdown.
  const states = useMemo(() => {
    const s = new Set<string>();
    for (const l of locations) {
      const st = parseState(l.name);
      if (st) s.add(st);
    }
    return Array.from(s).sort();
  }, [locations]);

  const filtered = useMemo(() => {
    if (stateFilter === "ALL") return locations;
    return locations.filter((l) => parseState(l.name) === stateFilter);
  }, [locations, stateFilter]);

  async function handleSave(loc: ForecastLocation) {
    await save(loc);
    setModal({ open: false, editing: null });
  }

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <div className={styles.sectionHeadRow}>
          <div className={styles.titleGroup}>
            <h2>Change in Forecast</h2>
          </div>
          <div style={{ display: "flex", gap: ".5rem" }}>
            <Link href="/forecast-map" className={styles.btnSecondary}>
              🗺️ Map view
            </Link>
            {isAdmin && (
              <button
                className={styles.btnSecondary}
                onClick={handleRefreshAll}
                disabled={refreshing}
                title="Pull a fresh NWS forecast for every tracked location now"
              >
                {refreshing ? "↻ Refreshing…" : "🔄 Refresh All"}
              </button>
            )}
            {isAdmin && (
              <button
                className={styles.headerBtn}
                onClick={() => setModal({ open: true, editing: null })}
              >
                + Add Location
              </button>
            )}
          </div>
        </div>

        <div className={styles.sectionBody}>
          <p
            style={{
              fontFamily: "Lato, sans-serif",
              fontSize: ".85rem",
              color: "#666",
              marginBottom: "1.25rem",
            }}
          >
            Snapshots are taken automatically at <strong>3:01 AM</strong> and{" "}
            <strong>3:01 PM Central</strong>, one minute after NWS's two daily
            forecast revisions. Cells are shaded by the delta vs the previous
            snapshot —{" "}
            <span style={{ color: "#dc2626", fontWeight: 700 }}>red</span> =
            warmer/drier,{" "}
            <span style={{ color: "#1d4ed8", fontWeight: 700 }}>blue</span> =
            cooler/wetter.
          </p>

          {error && <p className={styles.error}>{error}</p>}
          {loading && <p className={styles.loading}>Loading locations…</p>}
          {!loading && locations.length === 0 && !error && (
            <p className={styles.empty}>
              {isAdmin ? (
                <>
                  No locations tracked yet — click{" "}
                  <strong>+ Add Location</strong> to start.
                </>
              ) : (
                "No locations are being tracked yet."
              )}
            </p>
          )}

          {/* Filter bar — narrow to a state */}
          {!loading && locations.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: ".6rem",
                alignItems: "center",
                marginBottom: "1rem",
                fontFamily: "Lato, sans-serif",
              }}
            >
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                style={{
                  padding: ".45rem .6rem",
                  border: "1px solid #cdd6bd",
                  borderRadius: 4,
                  fontSize: ".85rem",
                  fontFamily: "Lato, sans-serif",
                  color: "#1a2e0f",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                <option value="ALL">All states</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: ".78rem", color: "#6a7a55" }}>
                {filtered.length} of {locations.length}
              </span>
              {stateFilter !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setStateFilter("ALL")}
                  className={styles.btnSecondary}
                  style={{ fontSize: ".78rem", padding: ".35rem .6rem" }}
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {!loading && locations.length > 0 && filtered.length === 0 ? (
            <p className={styles.empty}>No locations match your filter.</p>
          ) : (
            <LocationsGrid
              locations={filtered}
              onEdit={
                isAdmin
                  ? (loc) => setModal({ open: true, editing: loc })
                  : undefined
              }
              onDelete={isAdmin ? remove : undefined}
            />
          )}
        </div>
      </div>

      {isAdmin && modal.open && (
        <ForecastLocationModal
          initial={modal.editing}
          onSave={handleSave}
          onClose={() => setModal({ open: false, editing: null })}
        />
      )}
    </div>
  );
}
