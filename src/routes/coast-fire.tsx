import { InputRHF } from "@/components/InputRHF";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LineChart, Line, XAxis, YAxis, Legend, ReferenceLine } from "recharts";
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
import { AnimatePresence, motion } from "framer-motion";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

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

  const form = useForm<CoastFireForm>({
    resolver: zodResolver(coastFireFormSchema),
    defaultValues: {
      age: 30,
      retirementAge: 67,
      retirementSpend: 30_000,
      currentInvested: 100_000,
      monthlyContribution: 500,
      equityPremium: 0.068,
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
                      <div className="mx-auto w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <div className="mx-auto w-full max-w-3xl grid grid-cols-1 gap-4">
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
            </form>
          </Form>
        </CardContent>
        <CardContent className="flex justify-end pt-0">
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            Submit
          </Button>
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
}

function CoastFireChart({ data }: { data: CoastFireForm }) {
  const {
    points: chartData,
    isCoastFire,
    coastFireAge,
  } = calculateCoastFire(data);

  const config = {
    age: {
      label: "Age",
    },
    currentTrajectory: {
      label: "Current Trajectory",
      color: "#00FFFF",
    },
    targetAmount: {
      label: "Target Amount",
      color: "#00FFFF",
    },
    withContributions: {
      label: "With Contributions",
      color: "#00FFFF",
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
            <ChartContainer config={config} className="h-96 w-full">
              <LineChart data={chartData}>
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

                {coastFireAge && (
                  <ReferenceLine
                    x={coastFireAge}
                    stroke="#6366f1"
                    label={{
                      value: "FIRE",
                      position: "insideTopLeft",
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="targetAmount"
                  stroke="#ef4444"
                  strokeWidth={1}
                  name="Target Amount"
                  dot={false}
                />

                <Line
                  type="monotone"
                  dataKey="currentTrajectory"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Current Investments (Coast)"
                  dot={false}
                />

                <Line
                  type="monotone"
                  dataKey="withContributions"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="With Contributions"
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

const calculateCoastFire = (data: CoastFireForm) => {
  const yearsToRetirement = data.retirementAge - data.age;
  const targetRetirementAmount = data.retirementSpend / data.safeWithdrawRate;
  const annualReturn = data.equityPremium;
  const monthlyReturn = annualReturn / 12;

  // Calculate what current investments will be worth at retirement (coast fire trajectory)
  const futureValueCurrent =
    data.currentInvested * Math.pow(1 + annualReturn, yearsToRetirement);

  // Check if already coast fire
  const isCoastFire = futureValueCurrent >= targetRetirementAmount;

  // Generate chart data points
  const points: ChartDataPoint[] = [];
  let coastFireAge: number | null = null;

  for (let year = 0; year <= yearsToRetirement; year++) {
    const currentAge = data.age + year;

    // Current investments grown without additional contributions
    const currentTrajectoryValue =
      data.currentInvested * Math.pow(1 + annualReturn, year);

    // With monthly contributions
    const monthsInvested = year * 12;
    const futureValueContributions =
      monthsInvested > 0
        ? data.monthlyContribution *
          ((Math.pow(1 + monthlyReturn, monthsInvested) - 1) / monthlyReturn)
        : 0;
    const withContributionsValue =
      currentTrajectoryValue + futureValueContributions;

    points.push({
      age: currentAge,
      currentTrajectory: Math.round(currentTrajectoryValue),
      targetAmount: Math.round(targetRetirementAmount),
      withContributions: Math.round(withContributionsValue),
    });

    // Find fire age (when withContributions crosses target)
    if (!coastFireAge && withContributionsValue >= targetRetirementAmount) {
      coastFireAge = currentAge;
    }
    // TODO ^ this is fireAge
    // coastage should be backtracked from earliest
  }

  return { points, isCoastFire, coastFireAge };
};
