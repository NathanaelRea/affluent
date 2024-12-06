import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./components/ui/chart";
import { formatMoney, moneyFormatter, percentFormatter } from "./lib/utils";
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
  simCount: z.coerce.number(),
  initialInvestment: z.coerce.number(),
  withdrawRate: z.coerce.number(),
});
type MyForm = z.infer<typeof formSchema>;

const defaultValues: MyForm = {
  years: 30,
  simCount: 50,
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

  const chartConfig = {
    value: {
      label: "Average Value",
      color: "#FFFFFF",
    },
    year: {
      label: "Year",
      color: "#FFFFFF",
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
                reqPrefix="value"
                valueFormatter={(v) => formatMoney(Number(v))}
                hideIndicator
              />
            }
          />
          {[...Array(data.simCount).keys()].map((_, i) => (
            <Line
              key={i}
              dataKey={`sim-${i + 1}`}
              stroke="#AAAAAA"
              dot={false}
              strokeWidth={0.25}
            />
          ))}
          <Line dataKey={"value"} stroke="#FFFFFF" strokeWidth={2} />
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
          [`sim-${idx + 1}`]: result[year],
        };
      },
      { year: year } as IDK,
    );
    yearData.value =
      results.reduce((sum, result) => sum + result[year], 0) / data.simCount;
    chartData.push(yearData);
  }

  return chartData;
}

function monteCarloDrawdown(portfolio: Portfolio, data: MyForm): number[][] {
  const results: number[][] = [];
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
    results.push(yearlyBalances);
  }

  return results;
}

function randomNormal(fund: Fund): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return fund.meanReturn + fund.stdDev * z0;
}
