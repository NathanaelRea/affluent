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
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "./components/ui/form";
import { FIELD } from "./components/FIELD";
import { Button } from "./components/ui/button";

type IDK = {
  year: number;
  [key: string]: number;
};

const formSchema = z.object({
  years: z.coerce.number(),
  simCount: z.coerce.number().max(200, "My calcs are too slow for that many!"),
  initialInvestment: z.coerce.number(),
  withdrawRate: z.coerce.number(),
});
type MyForm = z.infer<typeof formSchema>;

const defaultValues: MyForm = {
  years: 30,
  simCount: 100,
  initialInvestment: 1_000_000,
  withdrawRate: 0.04,
};

export default function Monte() {
  const [data, setData] = useState<MyForm>(defaultValues);

  const form = useForm<MyForm>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = (data: MyForm) => {
    setData(data);
  };

  const portfolio: Portfolio = [
    { name: "Fund", meanReturn: 0.07, stdDev: 0.15, allocation: 1 },
  ];

  const chartData = generateChartData(portfolio, data);
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

  return (
    <div>
      <div className="flex items-center justify-center">
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
            <Button type="submit">Simulate</Button>
          </form>
        </Form>
      </div>
      {data && (
        <div>
          <div>
            Number of bankrupt simulations: {simBankruptMap.size} (
            {formatPercent(simBankruptMap.size / data.simCount)})
          </div>
          <div>
            Average terminal value:{" "}
            {formatMoney(chartData[chartData.length - 1].value)}
          </div>
          <div>
            Median terminal value:{" "}
            {formatMoney(chartData[chartData.length - 1].median)}
          </div>
          <div>
            10th percentile terminal value:{" "}
            {formatMoney(chartData[Math.floor(data.simCount * 0.1)].value)}
          </div>
        </div>
      )}
      <ChartContainer config={chartConfig}>
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
    </div>
  );
}

export type Fund = {
  name: string;
  meanReturn: number;
  stdDev: number;
  allocation: number;
};

export type Portfolio = Fund[];

function generateChartData(portfolio: Portfolio, data: MyForm) {
  const results = monteCarloDrawdown(portfolio, data);

  const chartData = [] as IDK[];
  for (let year = 0; year <= data.years; year++) {
    const yearData = results.reduce(
      (acc, result, idx) => {
        return {
          ...acc,
          [`sim-${idx + 1}`]: result.results[year],
        };
      },
      { year: year } as IDK,
    );
    const bankruptCount = results.filter(
      (result) => result.results[year] === undefined,
    ).length;
    const remainingCount = data.simCount - bankruptCount;
    yearData.value =
      remainingCount > 0
        ? results.reduce(
            (sum, result) => sum + (result.results[year] || 0),
            0,
          ) / remainingCount
        : 0;

    const sortedResults = results
      .map((result) => result.results[year])
      .filter((value) => value !== undefined)
      .sort((a, b) => a! - b!);

    yearData.median =
      remainingCount > 0 ? sortedResults[Math.floor(remainingCount / 2)]! : 0;

    chartData.push(yearData);
  }

  return chartData;
}

type Sim = {
  results: number[];
  bankrupt: boolean;
};

function monteCarloDrawdown(portfolio: Portfolio, data: MyForm) {
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

      balance *= 1 + randomNormal(portfolio[0]);
      yearlyBalances.push(balance);
    }
    results.push({
      results: yearlyBalances,
      bankrupt: balance <= 0,
    });
  }

  return results;
}

function randomNormal(fund: Fund): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return fund.meanReturn + fund.stdDev * z0;
}
