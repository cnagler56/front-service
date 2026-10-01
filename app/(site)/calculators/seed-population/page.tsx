import CalculatorShell, { Formula } from '@/src/components/calculators/CalculatorShell';
import SeedPopulationCalc from '@/src/components/calculators/SeedPopulationCalc';
import { pageMetadata } from '@/src/lib/seo';

export const metadata = pageMetadata('/calculators/seed-population');

export default function Page() {
  return (
    <CalculatorShell
      path="/calculators/seed-population"
      heading="Seed Population Calculator"
      howItWorks={<>
        <p>Not every seed you plant becomes a plant, so the seeding rate has to be higher than the final stand you want. Divide the target stand by expected germination and emergence:</p>
        <Formula>seeding rate = target final stand ÷ (germination % × emergence %)</Formula>
        <p>To check the planter, convert that to seeds per foot of row. An acre is 43,560 square feet, so the row feet in an acre depend on row spacing:</p>
        <Formula>row feet per acre = 43,560 ÷ (row spacing in inches ÷ 12)</Formula>
        <Formula>seeds per foot = seeding rate ÷ row feet per acre</Formula>
        <p><strong>Example:</strong> a 32,000 plant/acre target with 95% germination and 95% emergence needs 32,000 ÷ (0.95 × 0.95) ≈ 35,457 seeds per acre. In 30-inch rows there are 17,424 row feet per acre, so that is about 2.03 seeds per foot.</p>
      </>}
    >
      <SeedPopulationCalc />
    </CalculatorShell>
  );
}
