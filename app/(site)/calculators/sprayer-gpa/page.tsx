import CalculatorShell, { Formula } from '@/src/components/calculators/CalculatorShell';
import SprayerGpaCalc from '@/src/components/calculators/SprayerGpaCalc';
import { pageMetadata } from '@/src/lib/seo';

export const metadata = pageMetadata('/calculators/sprayer-gpa');

export default function Page() {
  return (
    <CalculatorShell
      path="/calculators/sprayer-gpa"
      heading="Sprayer GPA Calculator"
      howItWorks={<>
        <p>The standard broadcast-spraying formula converts nozzle flow, ground speed and nozzle spacing into an application rate in gallons per acre:</p>
        <Formula>GPA = (5,940 × GPM per nozzle) ÷ (MPH × nozzle spacing in inches)</Formula>
        <p>5,940 is a unit-conversion constant that combines square feet per acre, inches per foot, and feet per mile. Total boom flow is the number of nozzles (boom width in inches ÷ spacing) times the flow per nozzle.</p>
        <p><strong>Example:</strong> 0.4 GPM nozzles on 20-inch spacing at 10 mph apply (5,940 × 0.4) ÷ (10 × 20) = 11.88 gallons per acre. A 60-foot boom carries 36 nozzles for a total flow of 14.4 gallons per minute.</p>
      </>}
    >
      <SprayerGpaCalc />
    </CalculatorShell>
  );
}
