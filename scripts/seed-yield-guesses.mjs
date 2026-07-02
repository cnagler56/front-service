/**
 * Dev utility: generate SQL to seed dummy Yield Challenge guesses for testing
 * the Results page (the Top-10 countdown, By Group / By State boards).
 *
 * It only PRINTS SQL — it never touches a database. Pipe it to a file and run
 * that against the target DB yourself.
 *
 *   node scripts/seed-yield-guesses.mjs > seed-guesses.sql
 *   mysql -h HOST -P PORT -u USER -pPASS DB < seed-guesses.sql
 *
 * Tunables (env vars): COUNT, COMMODITY, YEAR, CENTER, SPREAD.
 *   COUNT=120 COMMODITY=SOYBEANS YEAR=2026 CENTER=52 SPREAD=5 node scripts/seed-yield-guesses.mjs
 *
 * Notes:
 *   - Rows are tagged note='SEED' and use user_id >= 900001 so they're easy to
 *     remove and won't collide with real accounts (no FK on user_id).
 *   - Dates are set in June of YEAR so they're BEFORE the report cutoff (guesses
 *     dated on/after the USDA publication time are ignored by the scorer).
 *   - These appear in the public Community Guesses roster immediately — only run
 *     against production if you're OK with that.
 *
 * To watch the countdown BEFORE the real report, also give the scorer a national
 * USDA number (delete it before the real report is ingested, or it will skew the
 * real figure):
 *   INSERT INTO yield_snapshot (commodity, state, `year`, referencePeriod, yield_bu, acres, nass_load_time, fetched_at)
 *   VALUES ('CORN', 'ZZTEST', 2026, 'AUG', 181.0, 90000000, '2026-07-15 12:00:00', NOW());
 *
 * Cleanup:
 *   DELETE FROM yield_guess    WHERE note='SEED';
 *   DELETE FROM yield_snapshot WHERE state='ZZTEST';
 */

const COMMODITY = process.env.COMMODITY || 'CORN';
const YEAR = Number(process.env.YEAR || 2026);
const COUNT = Number(process.env.COUNT || 90);
const CENTER = Number(process.env.CENTER || 181);
const SPREAD = Number(process.env.SPREAD || 16);

const first = ['John', 'Dave', 'Karen', 'Doug', 'Craig', 'Brenda', 'Gary', 'Dennis', 'Marlene', 'Chad', 'Trent', 'Curt', 'Randy', 'Deb', 'Cindy', 'Kurt', 'Wade', 'Cole', 'Brett', 'Stan', 'Lyle', 'Merle', 'Duane', 'Arlen', 'Vern', 'Darrel', 'Roger', 'Chuck', 'Jerry', 'Norm', 'Gene', 'Hank', 'Rollie', 'Peg', 'Lonnie', 'Kent', 'Boyd', 'Dale', 'Clint', 'Marv', 'Orv', 'Wes', 'Bud', 'Cy', 'Del', 'Reid', 'Troy', 'Kip'];
const last = ['Johnson', 'Anderson', 'Nelson', 'Petersen', 'Schmidt', 'Meyer', 'Bauer', 'Hoffman', 'Schulte', 'Kruse', 'Vander Wal', 'Schmitt', 'Ohlde', 'Tegtmeier', 'Brummer', 'Rasmussen', 'Hulstein', 'Feldkamp', 'Stensland', 'Bierman', 'Sorensen', 'Aalbers', 'Dykstra', 'Tjaden', 'Bruns', 'Kramer', 'Reinke', 'Wollenberg', 'Hovden', 'Vos', 'Ohnemus', 'Steffen', 'Wieben', 'Kaczmarek', 'Ludwig', 'Rohrer', 'Behnke', 'Dvorak', 'Novak', 'Zeman'];

// Weighted toward the core Corn Belt so the By-State board has depth where it should.
const stateW = { IA: 6, IL: 5, IN: 4, NE: 4, MN: 4, OH: 3, MO: 3, SD: 2, KS: 2, WI: 2, ND: 1 };
const states = Object.entries(stateW).flatMap(([s, w]) => Array(w).fill(s));
// Match the app's signup interest options. Weights bias toward the common ones.
const intW = { Farmer: 8, Retired: 2, Investor: 2, Analyst: 2, Student: 1, Other: 1 };
const interests = Object.entries(intW).flatMap(([s, w]) => Array(w).fill(s));

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const esc = (s) => s.replace(/'/g, "''");
const bell = () => (Math.random() + Math.random() + Math.random()) / 3; // centered ~0.5

const rows = [];
const used = new Set();
for (let i = 0; i < COUNT; i++) {
  let name;
  do { name = `${pick(first)} ${pick(last)}`; } while (used.has(name));
  used.add(name);
  const est = (CENTER + (bell() * 2 - 1) * SPREAD).toFixed(1);
  const uid = 900001 + i;
  const day = String(2 + Math.floor(Math.random() * 24)).padStart(2, '0');
  const hh = String(7 + Math.floor(Math.random() * 11)).padStart(2, '0');
  const mm = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  rows.push(`  ('${COMMODITY}', ${YEAR}, ${est}, '${esc(name)}', '${pick(states)}', '${pick(interests)}', ${uid}, '${YEAR}-06-${day} ${hh}:${mm}:00', 'SEED')`);
}

console.log('INSERT INTO yield_guess (commodity, `year`, estimate, name, state, interest, user_id, `date`, note) VALUES');
console.log(rows.join(',\n') + ';');
