import { InputRHF } from "@/components/InputRHF";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LineChart, Line, XAxis, YAxis, Legend } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import { estimateAnnualSocialSecurity } from "@/lib/socialSecurity";
import StatBox from "@/components/StatBox";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { COLORS } from "@/colors";

export const Route = createFileRoute("/coast-fire")({
  component: RouteComponent,
});

const percentSchema = z.number().min(0).max(1);
const ageSchema = z.number().min(1).max(100);

const coastFireFormSchema = z
  .object({
    age: ageSchema,
    retirementAge: ageSchema,
    retirementSpend: z.number(),
    annualIncome: z.number(),
    currentInvested: z.number(),
    monthlyContribution: z.number(),
    equityPremium: percentSchema,
    safeWithdrawRate: percentSchema,
  })
  .refine((data) => data.age < data.retirementAge, {
    message: "Age cannot be larger than retirementAge",
    path: ["age"],
  });
type CoastFireForm = z.infer<typeof coastFireFormSchema>;

function RouteComponent() {
  const [data, setData] = useState<CoastFireForm | undefined>(undefined);
  const [tab, setTab] = useState<"basic" | "advanced">("basic");

  const form = useForm({
    resolver: zodResolver(coastFireFormSchema),
    defaultValues: {
      age: 30,
      retirementAge: 67,
      retirementSpend: 80_000,
      annualIncome: 80_000,
      currentInvested: 50_000,
      monthlyContribution: 1_000,
      equityPremium: 0.06,
      safeWithdrawRate: 0.04,
    },
  });

  function onSubmit(data: CoastFireForm) {
    setData(data);
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-2xl">Coast FIRE Calculator</CardTitle>
          <CardDescription>Calculate when you can Coast FIRE.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="w-full flex justify-center">
                <div
                  role="tablist"
                  aria-label="Coast FIRE form sections"
                  className="relative inline-flex items-center gap-1 rounded-full bg-muted p-1"
                >
                  {(
                    [
                      { id: "basic", label: "Basic" },
                      { id: "advanced", label: "Advanced" },
                    ] as const
                  ).map((t) => {
                    const isActive = tab === t.id;
                    return (
                      <button
                        type="button"
                        key={t.id}
                        role="tab"
                        aria-selected={isActive}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => setTab(t.id)}
                        className={
                          "relative z-10 rounded-full px-3 py-1 text-sm font-medium transition-colors"
                        }
                        style={{ WebkitTapHighlightColor: "transparent" }}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="coast-fire-tab-pill"
                            className="absolute inset-0 z-[-1] bg-background shadow"
                            style={{ borderRadius: 9999 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 40,
                            }}
                          />
                        )}
                        <span
                          className={
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }
                        >
                          {t.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <AnimatePresence mode="wait">
                {tab === "basic" ? (
                  <motion.div
                    key="basic"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      id="panel-basic"
                      role="tabpanel"
                      aria-labelledby="tab-basic"
                      className="transition-all"
                    >
                      <div className="mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputRHF
                          form={form}
                          type="number"
                          formKey="age"
                          label="Age"
                        />
                        <InputRHF
                          form={form}
                          type="number"
                          formKey="retirementAge"
                          label="Retirement Age"
                        />
                        <InputRHF
                          form={form}
                          type="money"
                          formKey="retirementSpend"
                          label="Retirement spend"
                        />
                        <InputRHF
                          form={form}
                          type="money"
                          formKey="annualIncome"
                          label="Annual Income"
                          tooltip="To calculate SSA benefits"
                        />
                        <InputRHF
                          form={form}
                          type="money"
                          formKey="currentInvested"
                          label="Current Invested"
                        />
                        <InputRHF
                          form={form}
                          type="money"
                          formKey="monthlyContribution"
                          label="Monthly Contribution"
                        />
                        <InputRHF
                          form={form}
                          type="percentage"
                          formKey="safeWithdrawRate"
                          label="Safe Withdraw Rate"
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="advanced"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      id="panel-advanced"
                      role="tabpanel"
                      aria-labelledby="tab-advanced"
                      className="transition-all"
                    >
                      <div className="mx-auto w-full grid grid-cols-2 gap-4">
                        <InputRHF
                          form={form}
                          type="percentage"
                          formKey="equityPremium"
                          label="Equity Premium"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex justify-end">
                <Button type="submit">Submit</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      {data && <CoastFireChart key={JSON.stringify(data)} data={data} />}
    </>
  );
}

interface ChartDataPoint {
  age: number;
  currentTrajectory: number;
  targetAmount: number;
  withContributions: number;
  coastPath?: number;
}

function CoastFireChart({ data }: { data: CoastFireForm }) {
  const {
    points: chartData,
    isCoastFire,
    coastFireAge,
    summary,
  } = calculateCoastFire(data);

  const config = {
    age: {
      label: "Age",
    },
    currentTrajectory: {
      label: "Current Trajectory",
    },
    targetAmount: {
      label: "Target Amount",
    },
    withContributions: {
      label: "With Contributions",
    },
    coastPath: {
      label: "Invest → Coast",
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      {chartData.length > 0 && (
        <Card className="transition-all data-[size=expanded]:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Coast FIRE Projection
              {isCoastFire && (
                <Badge variant="default" className="bg-green-500">
                  Already Coast FIRE! 🎉
                </Badge>
              )}
              {!isCoastFire && coastFireAge && (
                <Badge variant="secondary">
                  Coast FIRE at age {coastFireAge}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Track your path to Coast FIRE with current investments vs. with
              continued contributions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <StatBox
                label="Retirement Spend"
                value={formatMoney(data.retirementSpend)}
              />
              <StatBox
                label={`SSA (est. @${data.retirementAge})`}
                value={formatMoney(summary.ssAnnual)}
              />
              <StatBox
                label="Effective Spend"
                value={formatMoney(summary.effectiveRetirementSpend)}
              />
              <StatBox
                label="SWR Target"
                value={formatMoney(summary.targetRetirementAmount)}
              />
            </div>
            <ChartContainer config={config} className="h-96 w-full">
              <LineChart
                data={chartData}
                style={{
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  padding: "0.5rem",
                }}
              >
                <XAxis
                  dataKey="age"
                  label={{
                    value: "Age",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis tickFormatter={formatMoney} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      indicator="line"
                      valueFormatter={(v) => formatMoney(Number(v))}
                    />
                  }
                />
                <Legend />

                <Line
                  type="monotone"
                  dataKey="targetAmount"
                  stroke={"#FF0000"}
                  strokeWidth={1}
                  name="Target"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="currentTrajectory"
                  stroke={COLORS.chart5}
                  strokeWidth={2}
                  name="Coast"
                  dot={false}
                />
                {coastFireAge !== null && !isCoastFire && (
                  <Line
                    type="monotone"
                    dataKey="coastPath"
                    stroke={COLORS.chart1}
                    strokeWidth={2}
                    name="Invest → Coast"
                    dot={false}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="withContributions"
                  stroke={COLORS.chart2}
                  strokeWidth={2}
                  name="Only Invest"
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function calculateCoastFire(data: CoastFireForm) {
  const yearsToRetirement = data.retirementAge - data.age;
  const annualReturn = data.equityPremium;
  const monthlyReturn = annualReturn / 12;

  const calcTarget = targetCalculator(data);
  const selectedTarget = calcTarget(data.retirementAge);

  const futureValueCurrent =
    data.currentInvested * Math.pow(1 + annualReturn, yearsToRetirement);
  const isCoastFire =
    futureValueCurrent >= selectedTarget.targetRetirementAmount;

  // Generate chart data points (for display across ages)
  const points: ChartDataPoint[] = [];
  let fireAge: number | null = null;
  let coastFire: { age: number; year: number; amount: number } | null = null;
  for (let year = 0; year <= yearsToRetirement; year++) {
    const currentAge = data.age + year;

    // You get different SSA benefits depending on claim age
    // So target is not a horizontal line. Higher before FRA, lower after
    const { targetRetirementAmount } = calcTarget(currentAge);
    const targetAmount = Math.round(targetRetirementAmount);

    // Current investments grown without additional contributions (annual compounding)
    const currentTrajectoryValue =
      data.currentInvested * Math.pow(1 + annualReturn, year);
    const currentTrajectory = Math.round(currentTrajectoryValue);

    // With monthly contributions while continuing to invest
    const monthsInvested = year * 12;
    const futureValueContributions =
      monthsInvested > 0
        ? monthlyReturn === 0
          ? data.monthlyContribution * monthsInvested
          : data.monthlyContribution *
            ((Math.pow(1 + monthlyReturn, monthsInvested) - 1) / monthlyReturn)
        : 0;
    const withContributionsValue =
      currentTrajectoryValue + futureValueContributions;
    const withContributions = Math.round(withContributionsValue);
    const MAGIC_REDUCTION_CLOSE_YEAR = 0.975;
    if (
      !fireAge &&
      withContributions >= targetAmount * MAGIC_REDUCTION_CLOSE_YEAR
    ) {
      fireAge = currentAge;
    }

    const ifWeRetireNow = Math.round(
      withContributions *
        Math.pow(1 + data.equityPremium, data.retirementAge - currentAge),
    );
    if (!coastFire && ifWeRetireNow >= selectedTarget.targetRetirementAmount) {
      coastFire = {
        year,
        age: currentAge,
        amount: withContributions,
      };
    }
    const coastPathValue = coastFire
      ? coastFire.amount *
        Math.pow(1 + data.equityPremium, year - coastFire.year)
      : null;
    const coastPath = coastPathValue ? Math.round(coastPathValue) : undefined;

    points.push({
      age: currentAge,
      currentTrajectory,
      targetAmount,
      withContributions,
      coastPath,
    });
  }

  return {
    points,
    isCoastFire,
    coastFireAge: coastFire?.age,
    fireAge,
    summary: {
      ssAnnual: Math.round(selectedTarget.ssAnnual),
      effectiveRetirementSpend: Math.round(
        selectedTarget.effectiveRetirementSpend,
      ),
      targetRetirementAmount: Math.round(selectedTarget.targetRetirementAmount),
      yearsToRetirement,
      futureValueCurrent: Math.round(futureValueCurrent),
    },
  };
}

function targetCalculator(data: CoastFireForm) {
  return (claimAge?: number) => {
    const ssAnnual = estimateAnnualSocialSecurity({
      claimAge,
      currentAge: data.age,
      retirementAge: data.retirementAge,
      annualIncome: data.annualIncome,
    });
    const effectiveRetirementSpend = Math.max(
      0,
      data.retirementSpend - ssAnnual,
    );
    const targetRetirementAmount =
      effectiveRetirementSpend / data.safeWithdrawRate;
    return { ssAnnual, effectiveRetirementSpend, targetRetirementAmount };
  };
}
