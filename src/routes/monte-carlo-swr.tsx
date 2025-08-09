import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createFileRoute } from "@tanstack/react-router";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatMoney, percentFormatter } from "@/lib/utils";
import StatBox from "@/components/StatBox";
import { useEffect, useRef, useState, useTransition } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { DataTable } from "@/components/tables/basic-table";
import {
  Fund,
  fundColumns,
  fundSchema,
} from "@/components/tables/portfolio/columns";
import { InputRHF } from "@/components/InputRHF";
import ErrorMessage from "@/components/ErrorMessage.tsx";
import FundDialog from "@/components/FundDialog.tsx";

export const Route = createFileRoute("/monte-carlo-swr")({
  component: Monte,
});

type Simulation = {
  year: number;
  [key: string]: number;
};

const formSchema = z
  .object({
    years: z.number(),
    simCount: z.number().max(200, ">200 is a bit slow for recharts"),
    initialInvestment: z.number(),
    inflation: z.number().min(0).max(1, "Maximum of 100%"),
    withdrawRate: z.number().min(0).max(1, "Maximum of 100%"),
    portfolio: z.array(fundSchema),
  })
  .superRefine((data, ctx) => {
    const weightTotal = data.portfolio.reduce(
      (acc, val) => acc + val.weight,
      0,
    );
    const tol = 1e-4;
    if (Math.abs(weightTotal - 1) > tol) {
      ctx.addIssue({
        message: `Portfolio weights must sum to 100%`,
        code: "custom",
        origin: "portfolio",
      });
    }
  });
type MyForm = z.infer<typeof formSchema>;

const defaultValues: MyForm = {
  years: 30,
  simCount: 100,
  initialInvestment: 1_000_000,
  inflation: 0.02,
  withdrawRate: 0.04,
  portfolio: [
    { name: "Stocks", mean: 0.08, std: 0.15, weight: 0.5 },
    { name: "Bonds", mean: 0.03, std: 0.05, weight: 0.5 },
  ],
};

function Monte() {
  const [parsedData, setParsedData] = useState<ParsedData>();
  const [isPending, startTransition] = useTransition();

  const form = useForm<MyForm>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = (data: MyForm) => {
    startTransition(async () => {
      const chartData = await generateChartData(data);
      const simCount = data.simCount;
      const simBankruptMap = [...Array(simCount).keys()].reduce((acc, i) => {
        const key = `sim-${i + 1}`;
        const bankrupt = chartData[chartData.length - 1][key] == undefined;
        if (bankrupt) {
          acc.add(key);
        }
        return acc;
      }, new Set<string>());
      setParsedData({ chartData, simCount, simBankruptMap });
    });
  };

  const portfolio = form.watch("portfolio");

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Monte Carlo SWR</CardTitle>
          <CardDescription>
            Simulate a constant-withdrawal portfolio to visualize outcomes and
            risk.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <InputRHF form={form} formKey="years" label="Years" />
              <InputRHF
                form={form}
                formKey="initialInvestment"
                label="Initial Investment"
                type="money"
              />
              <InputRHF
                form={form}
                formKey="withdrawRate"
                label="Withdraw Rate"
                type="percentage"
              />
              <InputRHF
                form={form}
                formKey="inflation"
                label="Inflation"
                type="percentage"
              />
              <InputRHF
                form={form}
                formKey="simCount"
                label="Number of Simulations"
              />
              <FormLabel className="font-bold text-lg col-span-1 md:col-span-2">
                Portfolio
              </FormLabel>
              <div className="col-span-1 md:col-span-2">
                <DataTable
                  columns={fundColumns}
                  data={portfolio}
                  setValue={(name, value) => {
                    form.setValue(
                      name as
                        | `portfolio.${number}.mean`
                        | `portfolio.${number}.std`
                        | `portfolio.${number}.weight`,
                      Number(value),
                    );
                  }}
                  deleteRow={(index) => {
                    form.setValue(
                      "portfolio",
                      portfolio.filter((_, i) => i !== index),
                    );
                  }}
                />
                <FundDialog
                  handleSubmit={(data: Fund) => {
                    form.setValue("portfolio", [...portfolio, data]);
                  }}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    <PlusIcon className="h-2" />
                  </Button>
                </FundDialog>
                <ErrorMessage
                  message={form.formState.errors.portfolio?.message}
                />
              </div>
              <ErrorMessage
                message={form.formState.errors?.portfolio?.message}
              />
              <div className="flex justify-end col-span-1 md:col-span-2">
                <Button type="submit" disabled={isPending}>
                  Simulate
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Simulation results</CardTitle>
            <CardDescription>
              Aggregate outcomes and distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Chart parsedData={parsedData} />
          </CardContent>
        </Card>
      )}
    </>
  );
}

type ParsedData = {
  chartData: Simulation[];
  simBankruptMap: Set<string>;
  simCount: number;
};

function Chart({ parsedData }: { parsedData: ParsedData }) {
  const { chartData, simBankruptMap, simCount } = parsedData;

  const chartConfig = {
    value: {
      label: "Average",
    },
    median: {
      label: "Median",
    },
    tenth: {
      label: "Tenth Percentile",
    },
    year: {
      label: "Year",
    },
  } satisfies ChartConfig;

  const extraLines = ["value", "median", "tenth"];

  const animationEnabled = simCount <= 100;
  const lastYearData = chartData[chartData.length - 1];

  const chartRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
        <StatBox
          label="Bankrupt Sims"
          value={simBankruptMap.size}
          extra={`(${percentFormatter.format(simBankruptMap.size / simCount)})`}
        />
        <StatBox
          label="Average Terminal"
          value={formatMoney(lastYearData.value)}
        />
        <StatBox
          label="Median Terminal"
          value={formatMoney(lastYearData.median)}
        />
        <StatBox
          label="10th Percentile"
          value={formatMoney(lastYearData.tenth)}
        />
      </div>
      <ChartContainer config={chartConfig} ref={chartRef}>
        <LineChart
          className="w-full p-2"
          accessibilityLayer
          data={chartData}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis dataKey="year" tickMargin={8} />
          <YAxis
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={formatMoney}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                ignorePrefix="sim"
                valueFormatter={(v) => formatMoney(Number(v))}
                hideIndicator
              />
            }
          />
          {[...Array(simCount).keys()].map((_, i) => {
            const key = `sim-${i + 1}`;
            const bankrupt = simBankruptMap.has(key);
            return (
              <Line
                key={i}
                isAnimationActive={animationEnabled}
                dataKey={key}
                stroke={bankrupt ? "#FF0000" : "#444444"}
                dot={false}
                strokeWidth={0.5}
              />
            );
          })}
          {extraLines.map((dataKey) => (
            <Line
              key={dataKey}
              isAnimationActive={animationEnabled}
              dataKey={dataKey}
              stroke="#00FFFF"
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </>
  );
}

async function generateChartData(data: MyForm) {
  const results = monteCarloDrawdown(data);

  const chartData = [] as Simulation[];
  // Include last because 0th is initial
  for (let year = 0; year <= data.years; year++) {
    const yearData = results.reduce(
      (acc, result, idx) => {
        return {
          ...acc,
          [`sim-${idx + 1}`]: result.results[year],
        };
      },
      { year: year } as Simulation,
    );
    const bankruptCount = results.filter(
      (result) => result.results[year] === undefined,
    ).length;

    const remainingCount = data.simCount - bankruptCount;
    if (remainingCount > 0) {
      yearData.value =
        results.reduce((sum, result) => sum + (result.results[year] || 0), 0) /
        remainingCount;

      const sortedResults = results
        .map((result) => result.results[year])
        .filter((value) => value !== undefined)
        .sort((a, b) => a! - b!);

      yearData.median = sortedResults[Math.floor(remainingCount * 0.5)];
      yearData.tenth = sortedResults[Math.floor(remainingCount * 0.1)];
    } else {
      yearData.value = 0;
      yearData.median = 0;
      yearData.tenth = 0;
    }

    chartData.push(yearData);
  }

  return chartData;
}

type Sim = {
  results: number[];
  bankrupt: boolean;
};

function monteCarloDrawdown(data: MyForm) {
  const results: Sim[] = [];
  const withdrawAmount = data.initialInvestment * data.withdrawRate;

  for (let i = 0; i < data.simCount; i++) {
    let balance = data.initialInvestment;
    const yearlyBalances: number[] = [balance];

    // Include last because 0th is initial
    for (let year = 0; year <= data.years; year++) {
      balance -= withdrawAmount;
      if (balance < 0) {
        break;
      }

      balance *= 1 + randomNormalForPortfolio(data.portfolio);
      balance *= 1 - data.inflation;
      yearlyBalances.push(balance);
    }
    results.push({
      results: yearlyBalances,
      bankrupt: balance <= 0,
    });
  }

  return results;
}

function randomNormalForPortfolio(portfolio: Fund[]): number {
  return portfolio.reduce(
    (acc, fund) => acc + randomNormal(fund) * fund.weight,
    0,
  );
}

function randomNormal(fund: Fund): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return fund.mean + fund.std * z0;
}
