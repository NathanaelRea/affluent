import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./components/ui/chart";
import { formatMoney, moneyFormatter } from "./lib/utils";
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
  iterations: z.coerce.number(),
  initialInvestment: z.coerce.number(),
});
type MyForm = z.infer<typeof formSchema>;

const defaultValues: MyForm = {
  years: 30,
  iterations: 50,
  initialInvestment: 1_000_000,
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
    { name: "Fund A", meanReturn: -0.04, stdDev: 0.1, allocation: 1 },
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FIELD form={form} formKey="years" label="Years" />
          <FIELD form={form} formKey="iterations" label="Iterations" />
          <FIELD
            form={form}
            formKey="initialInvestment"
            label="Initial Investment"
            format={moneyFormatter}
          />
          <Button type="submit">Simulate</Button>
        </form>
      </Form>
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
          {[...Array(data.iterations).keys()].map((_, i) => (
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

export type SimulationParams = {
  initialInvestment: number;
  years: number;
  iterations: number;
};

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
      results.reduce((sum, result) => sum + result[year], 0) / data.iterations;
    chartData.push(yearData);
  }

  return chartData;
}

function monteCarloDrawdown(
  portfolio: Portfolio,
  data: {
    initialInvestment: number;
    years: number;
    iterations: number;
  },
): number[][] {
  const results: number[][] = [];

  for (let i = 0; i < data.iterations; i++) {
    let balance = data.initialInvestment;
    const yearlyBalances: number[] = [balance];

    for (let year = 0; year < data.years; year++) {
      let yearlyReturn = 0;
      portfolio.forEach((fund) => {
        const fundReturn = fund.meanReturn + fund.stdDev * getRandomGaussian();
        yearlyReturn += fundReturn * fund.allocation;
      });
      // Compound
      balance *= 1 + yearlyReturn;
      yearlyBalances.push(balance);
    }
    results.push(yearlyBalances);
  }

  return results;
}

const getRandomGaussian = (): number => {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
};
