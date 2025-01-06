import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./components/ui/chart";
import {
  formatMoney,
  formatPercent,
  moneyFormatter,
  percentFormatter,
} from "./lib/utils";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormLabel } from "./components/ui/form";
import { FIELD } from "./components/FIELD";
import { Button } from "./components/ui/button";
import { PlusIcon } from "lucide-react";
import { DataTable } from "./components/tables/basic-table";
import {
  Fund,
  fundColumns,
  fundSchema,
} from "./components/tables/portfolio/columns";

type Simulation = {
  year: number;
  [key: string]: number;
};

const formSchema = z.object({
  years: z.coerce.number(),
  simCount: z.coerce.number().max(1000, "Probably too many!"),
  initialInvestment: z.coerce.number(),
  withdrawRate: z.coerce.number(),
  portfolio: z.array(fundSchema),
});
type MyForm = z.infer<typeof formSchema>;

const defaultValues: MyForm = {
  years: 30,
  simCount: 100,
  initialInvestment: 1_000_000,
  withdrawRate: 0.04,
  portfolio: [
    { name: "Stocks", mean: 0.08, std: 0.15, weight: 0.6 },
    { name: "Bonds", mean: 0.03, std: 0.05, weight: 0.4 },
  ],
};

export default function Monte() {
  const [data, setData] = useState<MyForm>();

  const form = useForm<MyForm>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = (data: MyForm) => {
    setData(data);
  };

  const portfolio = form.watch("portfolio");

  return (
    <div className="flex flex-col justify-center items-center p-4">
      <main className="flex flex-col max-w-4xl w-full">
        <h1 className="text-2xl">Safe withdraw rate Monte Carlo</h1>
        <h2 className="text-gray-400">
          Use Monte Carlo simulations to see the performance of an investment
          portfolio using a constant withdraw rate.
        </h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FIELD form={form} formKey="years" label="Years" />
            <FIELD
              form={form}
              formKey="initialInvestment"
              label="Initial Investment"
              format={moneyFormatter}
            />
            <FIELD
              form={form}
              formKey="withdrawRate"
              label="Withdraw Rate"
              format={percentFormatter}
            />
            <FIELD
              form={form}
              formKey="simCount"
              label="Number of Simulations"
            />
            <FormLabel className="font-bold text-lg">Portfolio</FormLabel>
            <DataTable
              columns={fundColumns}
              data={portfolio}
              deleteRow={(index) => {
                form.setValue(
                  "portfolio",
                  portfolio.filter((_, i) => i !== index),
                );
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                const curWeight = portfolio.reduce(
                  (acc, fund) => acc + fund.weight,
                  0,
                );
                form.setValue("portfolio", [
                  ...portfolio,
                  {
                    name: "",
                    mean: 0.07,
                    std: 0.15,
                    weight: 1 - curWeight,
                  },
                ]);
              }}
            >
              <PlusIcon className="h-2" />
            </Button>
            <div>
              <Button type="submit">Simulate</Button>
            </div>
          </form>
        </Form>
        {data && <Chart data={data} />}
      </main>
    </div>
  );
}

function Chart({ data }: { data: MyForm }) {
  const chartData = generateChartData(data);
  const simBankruptMap = [...Array(data.simCount).keys()].reduce((acc, i) => {
    const key = `sim-${i + 1}`;
    const bankrupt = chartData[chartData.length - 1][key] == undefined;
    if (bankrupt) {
      acc.add(key);
    }
    return acc;
  }, new Set<string>());

  const chartConfig = {
    value: {
      label: "Average Value",
    },
    median: {
      label: "Median Value",
    },
    year: {
      label: "Year",
    },
  } satisfies ChartConfig;

  const animationEnabled = data.simCount <= 100;
  const lastYearData = chartData[chartData.length - 1];

  const chartRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <>
      <div>
        <div>
          Number of bankrupt simulations: {simBankruptMap.size} (
          {formatPercent(simBankruptMap.size / data.simCount)})
        </div>
        <div>Average terminal value: {formatMoney(lastYearData.value)}</div>
        <div>Median terminal value: {formatMoney(lastYearData.median)}</div>
        <div>
          10th percentile terminal value: {formatMoney(lastYearData.tenth)}
        </div>
      </div>
      <ChartContainer config={chartConfig} ref={chartRef}>
        <LineChart
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
          {[...Array(data.simCount).keys()].map((_, i) => {
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
          <Line
            dataKey={"value"}
            stroke="#00FFFF"
            strokeWidth={2}
            dot={false}
          />
          <Line
            dataKey={"median"}
            stroke="#00AAAA"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </>
  );
}

function generateChartData(data: MyForm) {
  const results = monteCarloDrawdown(data);

  const chartData = [] as Simulation[];
  for (let year = 0; year < data.years; year++) {
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

    for (let year = 0; year < data.years; year++) {
      balance -= withdrawAmount;
      if (balance < 0) {
        break;
      }

      balance *= 1 + randomNormalForPortfolio(data.portfolio);
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
