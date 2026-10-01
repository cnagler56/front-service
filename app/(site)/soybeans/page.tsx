import CommodityDashboard from '@/src/components/commodity/CommodityDashboard';
import SoybeanCrushPanel from '@/src/components/commodity/SoybeanCrushPanel';
import styles from '@/src/styles/farm.module.css';
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return (
    <div className={styles.page}>
      <CommodityDashboard
        commodity="SOYBEANS"
        commodityLabel="Soybeans"
        pricesGroupName="Soybeans"
      />
      <SoybeanCrushPanel />
    </div>
  );
}

export const metadata = pageMetadata('/soybeans');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/soybeans" />
    </>
  );
}
