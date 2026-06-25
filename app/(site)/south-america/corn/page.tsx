import SouthAmericaPage from '@/src/components/southamerica/SouthAmericaPage';

export default function Page() {
  return (
    <SouthAmericaPage
      commodity="CORN"
      commodityLabel="Corn"
      regions={[
        { key: 'SOUTH_AMERICA', label: 'All SA' },
        { key: 'BRAZIL', label: 'Brazil' },
        { key: 'ARGENTINA', label: 'Argentina' },
      ]}
    />
  );
}
