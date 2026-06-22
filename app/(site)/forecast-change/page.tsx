import AuthRequired from '@/src/components/auth/AuthRequired';
import ForecastChangePage from '@/src/components/forecast/ForecastChangePage';

export default function Page() {
  return (
    <AuthRequired feature="Change in Forecast">
      <ForecastChangePage />
    </AuthRequired>
  );
}
