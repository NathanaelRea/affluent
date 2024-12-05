import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./components/ui/chart";
import { formatMoney } from "./lib/utils";

type IDK = {
  year: number;
  [key: string]: number;
};

export default function Monte() {
  const portfolio: Portfolio = [
    { name: "Fund A", meanReturn: 0.07, stdDev: 0.15, allocation: 0.6 },
    { name: "Fund B", meanReturn: 0.05, stdDev: 0.1, allocation: 0.4 },
  ];

  const years = 30;
  const iterations = 100;

  const runSimulation = () => {
    const initialInvestment = 1_000_000;

    const simResults = monteCarloDrawdown(
      portfolio,
      initialInvestment,
      years,
      iterations,
    );

    return simResults;
  };

  const results = runSimulation();
  const chartData = createChartData(results);

  function createChartData(results: number[][]): IDK[] {
    const ans = [] as IDK[];
    for (let year = 0; year < years; year++) {
      const data = results.reduce(
        (acc, result, idx) => {
          return {
            ...acc,
            [`sim-${idx + 1}`]: result[year],
          };
        },
        { year: year + 1 } as IDK,
      );
      data.value =
        results.reduce((sum, result) => sum + result[year], 0) / iterations;
      ans.push(data);
    }
    return ans;
  }

  const chartConfig = {
    value: {
      label: "Value",
      color: "#FFFFFF",
    },
    year: {
      label: "Year",
      color: "#FFFFFF",
    },
  } satisfies ChartConfig;

  console.log("results", results);
  console.log("chartData", chartData);

  return (
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
              valueFormatter={(v) => formatMoney(Number(v))}
            />
          }
        />
        {[...Array(iterations).keys()].map((_, i) => (
          <Line
            key={i}
            dataKey={`sim-${i + 1}`}
            stroke="#AAAAAA"
            dot={false}
            strokeWidth={0.25}
          />
        ))}
        <Line dataKey={"value"} stroke="#FFFFFF" dot={true} strokeWidth={2} />
      </LineChart>
    </ChartContainer>
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

const monteCarloDrawdown = (
  portfolio: Portfolio,
  initialInvestment: number,
  years: number,
  iterations: number,
): number[][] => {
  const results: number[][] = [];

  for (let i = 0; i < iterations; i++) {
    let balance = initialInvestment;
    const yearlyBalances: number[] = [];

    for (let year = 0; year < years; year++) {
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
};

const getRandomGaussian = (): number => {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
};
