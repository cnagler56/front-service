import CalculatorShell, { Formula } from '@/src/components/calculators/CalculatorShell';
import LoanCalc from '@/src/components/calculators/LoanCalc';
import { pageMetadata } from '@/src/lib/seo';

export const metadata = pageMetadata('/calculators/loan');

export default function Page() {
  return (
    <CalculatorShell
      path="/calculators/loan"
      heading="Loan Calculator"
      howItWorks={<>
        <p>The calculator uses the standard amortization formula for a fixed-rate loan with equal monthly payments:</p>
        <Formula>M = P × r(1 + r)ⁿ ÷ ((1 + r)ⁿ − 1)</Formula>
        <p>where P is the amount borrowed, r is the monthly interest rate (annual rate ÷ 12) and n is the number of monthly payments. Early payments are mostly interest; the share going to principal grows each month, which the amortization schedule shows row by row.</p>
        <p><strong>Example:</strong> $250,000 at 7.5% for 20 years (240 payments) costs about $2,013.98 a month, or $483,355.92 in total, of which $233,355.92 is interest.</p>
        <p>This covers principal and interest only. If your loan is paid on a different schedule, or your payment also includes property taxes, insurance or fees (as many mortgage payments do), your actual payment will differ, so treat this as an estimate and confirm the terms with your lender.</p>
      </>}
    >
      <LoanCalc />
    </CalculatorShell>
  );
}
