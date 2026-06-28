import ForecastMapPage from '@/src/components/forecast/ForecastMapPage';

// Public: the forecast map is read-only and a key draw for new visitors, so
// it's open without sign-in. (Editing tracked locations is still admin-gated.)
export default function Page() {
  return <ForecastMapPage />;
}
