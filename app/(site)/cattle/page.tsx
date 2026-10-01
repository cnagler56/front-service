import LivestockDashboard from '@/src/components/commodity/LivestockDashboard';
import styles from '@/src/styles/farm.module.css';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return (
    <div className={styles.page}>
      <LivestockDashboard
        commodity="CATTLE"
        commodityLabel="Cattle"
        pricesGroupName="Live Cattle"
        defaultMonth="1"   // Jan 1 — annual Cattle Inventory
        inventoryDescription="Live + Feeder Cattle futures, CFTC positioning, monthly Cattle on Feed, and the NASS inventory snapshot."
        extraPricesGroupName="Feeder Cattle"
      />
    </div>
  );
}

export const metadata = pageMetadata('/cattle');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/cattle" />
    </>
  );
}
