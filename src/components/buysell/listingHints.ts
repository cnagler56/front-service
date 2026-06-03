import { ListingCategory } from '@/src/lib/api';

/**
 * Per-category placeholder hints for the Add Listing modal. Keeping these as
 * pure functions (no JSX) lets the modal component stay focused on form state.
 */

export function titleHint(c: ListingCategory): string {
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

export function priceHint(c: ListingCategory): string {
  switch (c) {
    case 'HAY':       return '$8/bale or $200/ton';
    case 'LIVESTOCK': return '$1.85/lb or $1,200/head';
    case 'SERVICES':  return '$45/acre or $125/hour';
    default:          return '$25,000';
  }
}

export function qtyHint(c: ListingCategory): string {
  switch (c) {
    case 'HAY':       return '500 bales or 120 tons';
    case 'LIVESTOCK': return '50 head, avg 650 lbs';
    case 'SERVICES':  return 'Up to 2,000 acres';
    default:          return '';
  }
}

export function detailsHint(c: ListingCategory): string {
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
