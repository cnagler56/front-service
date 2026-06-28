import ForecastChangePage from '@/src/components/forecast/ForecastChangePage';

// Public: read-only forecast comparison, open without sign-in so visitors can
// explore it. Add/edit/delete/refresh controls remain admin-only in the page.
export default function Page() {
  return <ForecastChangePage />;
}
