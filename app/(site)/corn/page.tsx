import CommodityDashboard from "@/src/components/commodity/CommodityDashboard";
import styles from "@/src/styles/farm.module.css";
import PageAbout from '@/src/components/seo/PageAbout';
import { pageMetadata } from '@/src/lib/seo';

function PageContent() {
  return (
    <div className={styles.page}>
      <CommodityDashboard
        commodity="CORN"
        commodityLabel="Corn"
        pricesGroupName="Corn"
      />
    </div>
  );
}

export const metadata = pageMetadata('/corn');

export default function Page() {
  return (
    <>
      <PageContent />
      <PageAbout path="/corn" />
    </>
  );
}
