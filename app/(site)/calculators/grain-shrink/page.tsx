import CalculatorShell, { Formula } from '@/src/components/calculators/CalculatorShell';
import GrainShrinkCalc from '@/src/components/calculators/GrainShrinkCalc';
import { pageMetadata } from '@/src/lib/seo';

export const metadata = pageMetadata('/calculators/grain-shrink');

export default function Page() {
  return (
    <CalculatorShell
      path="/calculators/grain-shrink"
      heading="Grain Shrink Calculator"
      howItWorks={<>
        <p>Drying grain loses weight in two ways. The first is water loss, or moisture shrink: the dry matter stays the same while the water comes out.</p>
        <Formula>dry bushels = wet bushels × (100 − wet moisture %) ÷ (100 − target moisture %)</Formula>
        <p>The second is handling shrink, an extra deduction many elevators take for dust, fines and dry matter lost in handling. It is usually quoted as a percentage per point of moisture removed; 0.5% per point is a common figure, but check your elevator&rsquo;s schedule.</p>
        <Formula>handling shrink = wet bushels × handling % per point × points removed</Formula>
        <p><strong>Example:</strong> 1,000 bushels of corn at 20% moisture dried to 15% leaves 1,000 × 80 ÷ 85 ≈ 941.2 bushels. Handling shrink of 0.5% per point over 5 points removes another 25 bushels, for about 916.2 dry bushels: a total shrink of 8.38%.</p>
      </>}
    >
      <GrainShrinkCalc />
    </CalculatorShell>
  );
}
