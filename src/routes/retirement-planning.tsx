import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { ReactElement, useState } from "react";
import z from "zod";
import { Car, HeartPulse, TreePalm } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";

export const Route = createFileRoute("/retirement-planning")({
  component: RouteComponent,
});

type Nav = {
  href?: string;
  label: string;
  children?: Nav[];
};

const mainNav: Nav[] = [
  {
    label: "Profile",
    children: [
      { label: "NetWorth" },
      { label: "Goals" },
      { label: "Income" },
      { label: "Savings" },
      { label: "Expenses" },
      { label: "Blueprint" },
    ],
  },
  {
    label: "Dashboard",
    children: [
      { label: "Analysis" },
      { label: "Stress Test" },
      { label: "Social Security" },
      { label: "Medicare" },
      {
        label: "Cash Flow",
        children: [
          { label: "Maps" },
          { label: "Summary" },
          { label: "Net Worth" },
        ],
      },
    ],
  },
  { label: "Investment" },
  {
    label: "Retirement",
    children: [
      { label: "Probability" },
      { label: "Confidence" },
      { label: "Comparison" },
      { label: "Withdraw Rate" },
    ],
  },
  { label: "Insurance" },
  { label: "Education" },
];

function RouteComponent() {
  const [nav, setNav] = useState<Nav | null>(mainNav[0]);
  const [subNav, setSubNav] = useState<Nav | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 bg-accent/50 p-4">
        <div className="flex gap-4 group">
          {mainNav.map((n) => (
            <button
              onClick={() => setNav((v) => (v?.label == n.label ? null : n))}
              className="group-hover:opacity-50 cursor-pointer hover:opacity-100 hover:text-primary transition-all duration-200"
            >
              {n.label}
            </button>
          ))}
        </div>
        <div className="flex gap-4 group">
          {nav?.children?.map((n) => (
            <button
              onClick={() => setSubNav((v) => (v?.label == n.label ? null : n))}
              className="group-hover:opacity-50 cursor-pointer hover:opacity-100 hover:text-primary transition-all duration-200"
            >
              {n.label}
            </button>
          ))}
        </div>
        <div className="flex gap-4 group">
          {subNav?.children?.map((n) => (
            <button
              disabled
              className="group-hover:opacity-50 cursor-pointer hover:opacity-100 hover:text-primary transition-all duration-200"
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>
      {nav?.label}
      {subNav?.label}
    </div>
  );
}

function Investments() {
  const investSchema = z.object({
    assetAllocation: z.string(),
    allocationPath: z.string(),
    sectorAndStyle: z.string(),
    concentration: z.string(),
    taxAllocation: z.string(),
  });
}

function Blueprint({ main }: { main: Main }) {
  const nw = 0;

  function calc(a: any) {
    return 0;
  }

  return (
    <div>
      <span>{nw}</span>
      <span>
        {main.people.map((p) => (
          <div>
            <span>{p.firstName}</span>
            <span>{p.age}</span>
            <span>{calc(p.savings["401k"])}</span>
            <span>{calc(p.savings["IRA"])}</span>
            {/* accounts, assets? */}
          </div>
        ))}
      </span>
    </div>
  );
}

function FamilyForm() {
  const form = useForm({
    resolver: zodResolver(familySchema),
  });
  return null;
}

function GoalForm() {
  const form = useForm({
    resolver: zodResolver(goalSchema),
  });
  return null;
}

const MAX_AGE = 120;
const MIN_YEAR = 2025;
const MAX_YEAR = 2100;

const ageSchema = z.number().min(0).max(MAX_AGE);
const moneySchema = z.number().min(0);
const percentSchema = z.number().min(0).max(1);
const yearSchema = z.number().min(MIN_YEAR).max(MAX_YEAR);
const monthSchema = z.union([z.literal("Jan")]);

const smStringSchema = z.string().min(0).max(50);
const lgStringSchema = z.string().min(0).max(255);

const healthEstimateSchema = z.object({
  type: z.union([z.literal("Detailed"), z.literal("Approximate")]),
  costStartsPersonId: z.string(),
  preMedicare: moneySchema,
  outOfPocket: moneySchema,
});

const goalTypeSchema = z.union([
  z.literal("retirement"),
  z.literal("lifestyle"),
  z.literal("personalGift"),
]);

const boundsSchema = z.object({
  startType: z.union([
    z.literal("Calendar year"),
    z.literal("Client retirement"),
    z.literal("Co-Client retirement"),
  ]),
  startYear: yearSchema,
  end: z.discriminatedUnion("type", [
    z.object({ type: "After # years", years: z.number() }),
    z.object({ type: "No end" }),
  ]),
});

const goalMoneySchema = z.object({
  anualAmount: moneySchema,
  ownerPersonId: z.string(),
  bounds: boundsSchema,
  annualIncrease: z.union([z.literal("General Inflation"), z.literal("Fixed")]),
});

const giftMoneySchema = z.object({
  anualAmount: moneySchema,
  ownerPersonId: z.string(),
  bounds: boundsSchema,
  asset: z.union([z.literal("Cash")]),
  giftType: z.union([z.literal("Annual dollar amount")]),
  recipiant: z.union([z.literal("Other Individual")]),
  annualIncrease: z.union([z.literal("General Inflation"), z.literal("Fixed")]),
});

type GoalType = "travel" | "health" | "car";
function GoalIcon({ type }: { type: GoalType }): ReactElement {
  switch (type) {
    case "car":
      return <Car />;
    case "health":
      return <HeartPulse />;
    case "travel":
      return <TreePalm />;
  }
}
const goalSchema = z.discriminatedUnion("goal", [
  z.object({
    goal: z.literal("retirementAge"),
    age: ageSchema,
  }),
  z.object({
    goal: z.literal("livingEpenses"),
    monthlyExpense: moneySchema,
  }),
  z.object({
    goal: z.literal("health"),
    annualHealthCost: healthEstimateSchema,
  }),
  z.object({
    goal: z.literal("lifestyle"),
    anualAmount: goalMoneySchema,
    label: smStringSchema,
  }),
  z.object({
    goal: z.literal("gift"),
    anualAmount: giftMoneySchema,
    label: smStringSchema,
  }),
]);

type InvestedColumns = {
  year: number;
  ages: string;
  beginning: number;
  plannedSavings: number;
  employerMatchOther: number;
  plannedDistribution: number;
  netCashFlow: number;
  portfolioReturn: number;
  endingBalance: number;
};

function StressTest() {
  // recharts line, compare current and proposed
  // - monte carlo, range of returns, different potential sequences
  // - actual scenario (past year scenario, retire 1920 etc)
  return null;
}

const savingsStartSchema = z.discriminatedUnion("type", [
  z.object({ type: "Already Started" }),
  z.object({ type: "Date", year: yearSchema, month: monthSchema }),
]);
const savingEndSchema = z.union([
  z.literal("Client Retirement"),
  z.literal("Co-Client Retirement"),
]);

const matchSchema = z.object({
  match: percentSchema,
  to: percentSchema,
});
const flatMatchScheama = z.object({
  percent: percentSchema,
  dollar: moneySchema,
});
const idkMatchSchema = z.object({
  primary: matchSchema.optional(),
  secondary: matchSchema.optional(),
  flat: flatMatchScheama.optional(),
});

const retirement401kSchema = z.object({
  ownerPersonId: z.string(),
  target: z.union([z.literal("Maximum Contribution")]),
  start: savingsStartSchema,
  end: savingEndSchema,
  match: idkMatchSchema,
});

const retirementIRASchema = z.object({
  ownerPersonId: z.string(),
  target: z.union([z.literal("Maximum Contribution")]),
  start: savingsStartSchema,
  end: savingEndSchema,
});

const savingsSchema = z.object({
  "401k": retirement401kSchema.optional(),
  IRA: retirementIRASchema.optional(),
});

const investmentSchema = z.object({
  usEquity: moneySchema,
  intlEquity: moneySchema,
  emMarketEquity: moneySchema,
  realEstate: moneySchema,
  usBonds: moneySchema,
  intlBonds: moneySchema,
  cash: moneySchema,
  other: moneySchema,
});

const socialSecuritySchema = z.object({
  alreadyReceiving: z.boolean().default(false),
  filing: z.union([z.literal("FRA")]), // also gets month?
  estimatedBenefit: z.union([z.literal("Based on SS statement value")]),
  startAgeFromStatement: z.union([z.literal("FRA")]),
  monthlyBenefitFromStatement: moneySchema,
});

const incomeSchema = z.object({
  annualSalary: moneySchema,
  socialSecurity: socialSecuritySchema,
});

const personSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  relationship: z.union([z.literal("Client"), z.literal("Co-client")]),
  age: ageSchema,
  goals: goalSchema.array(),
  savings: savingsSchema,
  income: incomeSchema,
});

const familySchema = z.object({
  people: personSchema.array(),
  investments: investmentSchema,
});

type Main = z.infer<typeof familySchema>;

function CashFlowSummary() {
  // Adjusted for inflation (switch?)
  // Assume tax rate on top of income

  //    income - social security, etc, totalIncomeInflows
  //    socialSecurity - clientBenefit, coClientBenefit, total
  //
  //    expenses - living, healthCare, total
  //    living - retirement, total
  //    healthCare - person1 retirement HC, p2 HC, total
  //    retHC - pre-med (before 65), medPartB (65+), medPartD (65+), allOther, total
  //
  //    netFlow as % gives idea of if sustatinable
  //
  //

  // expenses: livingExp, housing, healthcare, total
  // livingExp: pre-Ret exp, Ret exp, total, (assume same, but increase with infl, i guess unless move?)
  // housing: propertyTax, total
  // healthcare: p1HC, p2HC, total
  // Goals: car, vacation, total
  // Tax: fed, (state?), fica, total
  // PlannedSavings: 401k, ira, total

  type cashFlowColumns = {
    year: number;
    age: string;
    incomeInflow: number;
    plannedDist: number;
    otherInflow: number;
    totalInflow: number;
    expenses: number;
    goalst: number;
    taxPayment: number;
    plannedSavings: number;
    totalOutflows: number;
    spendUnsavedCashFlows: number;
    netFlows: number;
  };

  return null;
}

function RetirementComparisons() {
  //  scenario analysis: string; line/area chart
  return null;
}

function RetirementWithdrawRate() {
  // Bar chart of withdraw rate (proposed plan), probably can stack with other plan?
  return null;
}

function ProposeChanges() {
  // Quick changes below comparisons chart:
  // goals: p1 ret age, p2 ret age, retirement monthlyExpense
  // strategies:
  // - assetAllocation
  // - socialSecurity: current, optimal, earlyAsPossible, FRA, 70, retirement, custom
  // - distributionStrat: current, ...what should 401k zod schema be
  // - retirmentSpending: inflationAdj, ...
  // I think you can change all goals, but just the "main" number, like annual amount, etc
  // - ret age
  // - ret month exp
  // - travel
  // - Fund *** Gift
  // - Healthcare
  return null;
}
