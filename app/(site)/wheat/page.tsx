import CommodityDashboard from '@/src/components/commodity/CommodityDashboard';
import styles from '@/src/styles/farm.module.css';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return (
    <div className={styles.page}>
      <CommodityDashboard
        commodity="WHEAT"
        commodityLabel="Wheat"
        pricesGroupName="Wheat"
        secondaryPricesGroupName="KC Wheat"
      />
    </div>
  );
}

export const metadata = pageMetadata('/wheat');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/wheat" />
    </>
  );
}
