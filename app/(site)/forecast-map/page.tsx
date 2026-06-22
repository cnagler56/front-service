import AuthRequired from '@/src/components/auth/AuthRequired';
import ForecastMapPage from '@/src/components/forecast/ForecastMapPage';

export default function Page() {
  return (
    <AuthRequired feature="the Forecast Map">
      <ForecastMapPage />
    </AuthRequired>
  );
}
