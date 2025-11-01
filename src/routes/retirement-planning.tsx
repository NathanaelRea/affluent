import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import {
  createContext,
  ReactElement,
  ReactNode,
  useContext,
  useState,
} from "react";
import { z } from "zod";
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

  const components = [
    <Blueprint />,
    <Investments />,
    <FamilyForm />,
    <GoalForm />,
    <RetirementComparisons />,
    <RetirementWithdrawRate />,
    <ProposeChanges />,
    <StressTest />,
    <CashFlowSummary />,
    <GoalIcon type="health" />,
  ];
  console.warn(components);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 bg-accent/50 p-4">
        <ul className="flex gap-4 group/root">
          {mainNav.map((n) => (
            <li className="group/nav">
              <button
                onClick={() => setNav((v) => (v?.label == n.label ? null : n))}
                className="group-hover/root:opacity-50 group-hover/nav:opacity-50 group-hover/subnav:opacity-50 cursor-pointer hover:opacity-100 hover:text-primary transition-all duration-200"
              >
                {n.label}
              </button>
            </li>
          ))}
        </ul>
        <ul className="flex gap-4 group">
          {nav?.children?.map((n) => (
            <li className="group/subnav">
              <button
                onClick={() =>
                  setSubNav((v) => (v?.label == n.label ? null : n))
                }
                className="group-hover/nav:opacity-50 group-hover/subnav:opacity-50 cursor-pointer hover:opacity-100 hover:text-primary transition-all duration-200"
              >
                {n.label}
              </button>
            </li>
          ))}
        </ul>
        <ul className="flex gap-4 group">
          {subNav?.children?.map((n) => (
            <li>
              <button
                disabled
                className="group-hover:opacity-50 cursor-pointer hover:opacity-100 hover:text-primary transition-all duration-200"
              >
                {n.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {nav?.label}
      {subNav?.label}
      <MainProvider>
        <div>hi</div>
      </MainProvider>
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
  const form = useForm({
    resolver: zodResolver(investSchema),
  });
  console.warn(form);

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
  const idk: InvestedColumns | null = null;
  console.warn(idk);

  return null;
}

const DEFAULT_CONTEXT: Main = {
  people: [
    {
      id: "",
      savings: {
        "401k": {
          end: "Client Retirement",
          ownerPersonId: "",
          match: {},
          start: {
            type: "",
            month: "Jan",
            year: 0,
          },
          target: "Maximum Contribution",
        },
        IRA: {
          ownerPersonId: "",
          start: {
            type: "",
            month: "Jan",
            year: 0,
          },
          end: "Client Retirement",
          target: "Maximum Contribution",
        },
      },
      age: 0,
      firstName: "",
      lastName: "",
      income: {
        annualSalary: 0,
        socialSecurity: {
          alreadyReceiving: false,
          estimatedBenefit: "Based on SS statement value",
          filing: "FRA",
          monthlyBenefitFromStatement: 0,
          startAgeFromStatement: "FRA",
        },
      },
      relationship: "Client",
      goals: [],
    },
  ],
  investments: {
    cash: 0,
    emMarketEquity: 0,
    intlBonds: 0,
    intlEquity: 0,
    other: 0,
    realEstate: 0,
    usBonds: 0,
    usEquity: 0,
  },
};

const mainContext = createContext({
  data: DEFAULT_CONTEXT,
  // eslint-disable-next-line
  setData: (_: Main) => undefined,
});

function useMainContext() {
  return useContext(mainContext);
}

function MainProvider({ children }: { children: ReactNode }) {
  const [main, setMain] = useState<Main>(DEFAULT_CONTEXT);
  return (
    <mainContext.Provider
      value={{
        data: main,
        setData: (d) => {
          setMain(d);
          return undefined;
        },
      }}
    >
      {children}
    </mainContext.Provider>
  );
}

function Blueprint() {
  const nw = 0;

  const { data: main } = useMainContext();

  function calc(a: string | undefined) {
    return a;
  }

  return (
    <div>
      <span>{nw}</span>
      <span>
        {main.people.map((p) => (
          <div>
            <span>{p.firstName}</span>
            <span>{p.age}</span>
            <span>{calc(p.savings["401k"]?.ownerPersonId)}</span>
            <span>{calc(p.savings["IRA"]?.ownerPersonId)}</span>
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
  console.warn(form);
  return null;
}

function GoalForm() {
  const form = useForm({
    resolver: zodResolver(goalSchema),
  });
  console.warn(form);
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
//const lgStringSchema = z.string().min(0).max(255);

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
    type: goalTypeSchema,
    goal: z.literal("retirementAge"),
    age: ageSchema,
  }),
  z.object({
    type: goalTypeSchema,
    goal: z.literal("livingEpenses"),
    monthlyExpense: moneySchema,
  }),
  z.object({
    type: goalTypeSchema,
    goal: z.literal("health"),
    annualHealthCost: healthEstimateSchema,
  }),
  z.object({
    type: goalTypeSchema,
    goal: z.literal("lifestyle"),
    anualAmount: goalMoneySchema,
    label: smStringSchema,
  }),
  z.object({
    type: goalTypeSchema,
    goal: z.literal("gift"),
    anualAmount: giftMoneySchema,
    label: smStringSchema,
  }),
]);

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

const retirementIRASchema = z.object({
  ownerPersonId: z.string(),
  target: z.union([z.literal("Maximum Contribution")]),
  start: savingsStartSchema,
  end: savingEndSchema,
});

const retirement401kSchema = retirementIRASchema.extend({
  match: idkMatchSchema,
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
  const idk: cashFlowColumns | null = null;
  console.warn(idk);

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
