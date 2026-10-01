/** The calculators, in display order. Each has its own page under /calculators. */
export const CALCULATORS = [
  {
    path: '/calculators/seed-population',
    name: 'Seed Population Calculator',
    blurb: 'Seeding rate, seeds per foot of row and seeds per 1/1000 acre from your target stand.',
  },
  {
    path: '/calculators/sprayer-gpa',
    name: 'Sprayer GPA Calculator',
    blurb: 'Gallons per acre from nozzle flow, ground speed and nozzle spacing.',
  },
  {
    path: '/calculators/grain-shrink',
    name: 'Grain Shrink Calculator',
    blurb: 'Dry bushels after moisture shrink and elevator handling shrink.',
  },
  {
    path: '/calculators/loan',
    name: 'Farm Loan Calculator',
    blurb: 'Monthly payment, total interest and a full amortization schedule.',
  },
] as const;
