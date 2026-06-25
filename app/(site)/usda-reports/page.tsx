import UsdaReportsPage from '@/src/components/usdaReports/UsdaReportsPage';

export default function Page({ searchParams }: { searchParams: { report?: string } }) {
  return <UsdaReportsPage initialReport={searchParams?.report} />;
}
