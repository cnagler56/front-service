import CommodityDashboard from '@/src/components/commodity/CommodityDashboard';
import SoyOilBiofuelPanel from '@/src/components/energy/SoyOilBiofuelPanel';
import styles from '@/src/styles/farm.module.css';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return (
    <div className={styles.page}>
      <CommodityDashboard
        commodity="SOYBEAN_OIL"
        commodityLabel="Soybean Oil"
        pricesGroupName="Soybean Oil"
        crushProduct
      />
      <SoyOilBiofuelPanel />
    </div>
  );
}

export const metadata = pageMetadata('/soybean-oil');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/soybean-oil" />
    </>
  );
}
