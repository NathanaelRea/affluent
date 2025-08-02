import { InputRHF } from "@/components/InputRHF";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <h1 className="text-2xl">Coast fire calculator</h1>
      <h2 className="text-gray-400 text-pretty">
        Calculate when you can coast fire
      </h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="basic" className="w-[400px]">
            <TabsList>
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            <TabsContent value="basic">
              <InputRHF form={form} type="number" formKey="age" label="Age" />
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
            </TabsContent>
            <TabsContent value="advanced">
              <InputRHF
                form={form}
                type="percentage"
                formKey="equityPremium"
                label="Equity Premium"
              />
            </TabsContent>
          </Tabs>
          <Button type="submit">Submit</Button>
        </form>
      </Form>
      {data && <CoastFireChart data={data} />}
    </>
  );
}

interface ChartDataPoint {
  age: number;
  currentTrajectory: number;
  targetAmount: number;
  withContributions: number;
}

export default function CoastFireChart({ data }: { data: CoastFireForm }) {
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
        <Card>
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
            <div className="h-96">
              <ChartContainer config={config}>
                <ResponsiveContainer width="100%" height="100%">
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
                </ResponsiveContainer>
              </ChartContainer>
            </div>
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
