import CommodityDashboard from '@/src/components/commodity/CommodityDashboard';
import styles from '@/src/styles/farm.module.css';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return (
    <div className={styles.page}>
      <CommodityDashboard
        commodity="SOYBEAN_MEAL"
        commodityLabel="Soybean Meal"
        pricesGroupName="Soybean Meal"
        crushProduct
      />
    </div>
  );
}

export const metadata = pageMetadata('/soybean-meal');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/soybean-meal" />
    </>
  );
}
