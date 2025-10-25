import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { formatMoney, formatPercent, secantMethod } from "@/lib/utils";
import { Combobox } from "@/components/combobox";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { MinusIcon, PlusIcon } from "lucide-react";
import {
  CITY_INFO,
  Tax,
  TAX_STATUS,
  TaxStatus,
  taxStatusSchema,
  citySchema,
  City,
  Category,
  CITIES,
  STATE_INFO,
} from "@/data";
import { FED_LIMITS, CITY_TAX, STATE_TAX, COST_OF_LIVING } from "@/data2024";
import { InputRHF, InputWithFormat } from "@/components/InputRHF";
import { ComboboxRHF } from "@/components/ComboboxRHF";
import { TooltipHelp } from "@/components/TooltipHelp";
import StatBox from "@/components/StatBox";

export const Route = createFileRoute("/cost-of-living")({
  component: CostOfLivingWrapped,
});

const cityHousingSchema = z.record(citySchema, z.number());
type CityHousing = z.infer<typeof cityHousingSchema>;

const costOfLivingSchema = z
  .object({
    city: citySchema,
    status: taxStatusSchema,
    salary: z.number(),
    expenses: z.object({
      housing: z.number(),
      transportaiton: z.number(),
      miscellaneous: z.number(),
      fixed: z.number(),
    }),
  })
  .superRefine((data, ctx) => {
    const modifiedAGI = calculateModifiedAGI(data);
    const totalExpenses = calculateExpenses(data.expenses);
    if (modifiedAGI - totalExpenses < 0) {
      ctx.addIssue({
        message: `Expenses and investments cannot exceed modified gross income (${formatMoney(modifiedAGI)}).`,
        code: "custom",
        origin: "expenses",
      });
    }
  });
type CostOfLiving = z.infer<typeof costOfLivingSchema>;

function calculateModifiedAGI(data: { salary: number }) {
  return data.salary - FED_LIMITS.standardDeduction;
}

function CostOfLivingWrapped() {
  const defaultValues = loadFromLocalStorage(STORAGE.finance);

  function resetDefaults() {
    saveToLocalStorage(STORAGE.finance, STORAGE.finance.default);
    window.location.reload(); // this is kinda dumb
  }

  return (
    <CostOfLiving defaultValues={defaultValues} resetDefaults={resetDefaults} />
  );
}

function CostOfLiving({
  defaultValues,
  resetDefaults,
}: {
  defaultValues: CostOfLiving | undefined;
  resetDefaults: () => void;
}) {
  const [data, setData] = useState<CostOfLiving | undefined>();

  const form = useForm({
    resolver: zodResolver(costOfLivingSchema),
    defaultValues,
  });

  function onSubmit(data: CostOfLiving) {
    setData(data);
    saveToLocalStorage(STORAGE.finance, data);
  }

  // TODO fix: need Number() right now because expenses setting as string?
  const totalMoExpenses = data ? calculateExpenses(data.expenses) : 0;
  const { netTakeHome, savingsRate } = data
    ? calculateNetTakeHomePay(data)
    : { netTakeHome: 0, savingsRate: 0 };

  return (
    <>
      <Card className="animate-in fade-in-0 zoom-in-95">
        <CardHeader>
          <CardTitle className="text-2xl">Cost of Living Calculator</CardTitle>
          <CardDescription>
            Compare two cities with detailed tax and expense adjustments to see
            what salary maintains your current lifestyle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <ComboboxRHF
                form={form}
                formKey="status"
                label="Filing Status"
                items={TAX_STATUS.map((status) => ({
                  value: status,
                  label: status,
                }))}
              />
              <ComboboxRHF
                form={form}
                formKey="city"
                label="City"
                items={CITIES.map((c) => ({
                  label: `${c}, ${STATE_INFO[CITY_INFO[c].state].abbreviation}`,
                  value: c,
                }))}
              />
              <InputRHF
                form={form}
                formKey="salary"
                label="Salary"
                type="money"
              />
              <div className="md:col-span-2 font-medium">Expenses</div>
              <InputRHF
                form={form}
                formKey="expenses.housing"
                label="Housing"
                type="money"
              />
              <InputRHF
                form={form}
                formKey="expenses.transportaiton"
                label="Transportation"
                type="money"
              />
              <InputRHF
                form={form}
                formKey="expenses.miscellaneous"
                label="Other"
                type="money"
              />
              <InputRHF
                form={form}
                formKey="expenses.fixed"
                label="Fixed"
                type="money"
              />
              {data && (
                <div className="md:col-span-2 w-full grid grid-cols-3 items-end gap-4">
                  <StatBox
                    label="Total Expenses"
                    value={formatMoney(totalMoExpenses)}
                  />
                  <StatBox
                    label="Net Take Home"
                    value={formatMoney(netTakeHome / 12)}
                  />
                  <StatBox
                    label="Savings Rate"
                    value={formatPercent(savingsRate)}
                  />
                </div>
              )}
              <div className="md:col-span-2 flex justify-between">
                <Button variant="outline" onClick={resetDefaults} type="button">
                  Reset
                </Button>
                <Button type="submit">Calculate</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {data && <Results data={data} />}
    </>
  );
}

type Store<T extends z.ZodTypeAny> = {
  key: string;
  schema: T;
  default: z.infer<T>;
};
const STORAGE = {
  finance: {
    key: "finance-data",
    schema: costOfLivingSchema,
    default: {
      city: "Philadelphia",
      status: "Single",
      salary: 100_000,
      expenses: {
        housing: 1_500,
        transportaiton: 500,
        miscellaneous: 2_500,
        fixed: 500,
      },
    } as CostOfLiving,
  },
  cityHousing: {
    key: "city-housing",
    schema: cityHousingSchema,
    default: {} as CityHousing,
  },
};

function saveToLocalStorage<TSchema extends z.ZodTypeAny>(
  storage: Store<TSchema>,
  data: z.infer<TSchema>,
) {
  try {
    localStorage.setItem(storage.key, JSON.stringify(data));
  } catch {
    console.error("Failed to save to local storage");
  }
}

function loadFromLocalStorage<TSchema extends z.ZodTypeAny>(
  storage: Store<TSchema>,
): z.infer<TSchema> {
  try {
    const rawData = localStorage.getItem(storage.key);
    if (!rawData) return storage.default;
    return storage.schema.parse(JSON.parse(rawData));
  } catch {
    return storage.default;
  }
}

function Results({ data }: { data: CostOfLiving }) {
  const [remoteCity, setRemoteCity] = useState<City>("San Francisco");

  const cityHousing = loadFromLocalStorage(STORAGE.cityHousing);

  const [customHousing, setCustomHousing] = useState<number | undefined>(
    cityHousing[remoteCity],
  );
  const { ref: resultsRef } = useScrollIntoView();

  function handleCity(c: City) {
    setRemoteCity(c);
    setCustomHousing(cityHousing[c]);
  }

  function addCustomHousing() {
    const remoteRent = data.expenses.housing;
    setCustomHousing(Math.round(remoteRent));
    save(remoteRent);
  }

  function removeCustomHousing() {
    setCustomHousing(undefined);
    save(undefined);
  }

  function updateCustomHousing(v: number) {
    setCustomHousing(v);
    save(v);
  }

  function save(v: number | undefined) {
    if (v) {
      cityHousing[remoteCity] = v;
      saveToLocalStorage(STORAGE.cityHousing, cityHousing);
    } else {
      delete cityHousing[remoteCity];
      saveToLocalStorage(STORAGE.cityHousing, cityHousing);
    }
  }

  const convertedData = convertCOLAndFindSalary(data, remoteCity, cityHousing);

  return (
    <div className="flex flex-col gap-4" ref={resultsRef}>
      <Card className="animate-in fade-in-0 zoom-in-95">
        <CardHeader>
          <CardTitle>Compare to Another City</CardTitle>
          <CardDescription>
            Choose a destination city and optionally override its housing cost.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">City</label>
              <Combobox
                name="city"
                items={CITIES.map((c) => ({
                  label: `${c}, ${STATE_INFO[CITY_INFO[c].state].abbreviation}`,
                  value: c,
                }))}
                value={remoteCity}
                setValue={(c) => handleCity(c as City)}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 block text-sm font-medium">
                <TooltipHelp text="There could be a 5x cost of living adjustment for housing (e.g. LOC <-> VHCOL), however in that case you will probably downsize/rightsize.">
                  Custom City Housing
                </TooltipHelp>
              </label>
              {customHousing ? (
                <div className="flex gap-2 items-center">
                  <InputWithFormat
                    value={customHousing}
                    onChange={updateCustomHousing}
                    onBlur={() => {}}
                    type="money"
                  />
                  <Button
                    type="button"
                    variant={"outline"}
                    size="sm"
                    onClick={removeCustomHousing}
                  >
                    <MinusIcon />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant={"outline"}
                  size="sm"
                  onClick={addCustomHousing}
                  className="w-fit"
                >
                  <PlusIcon />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="items-end">
          <CardDescription>Required Income</CardDescription>
          <CardTitle className="text-2xl">
            {formatMoney(convertedData.salary)}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            To maintain the same net take home
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-base font-medium">Taxes</h3>
            <MoneyBarChart
              localCity={data.city}
              remoteCity={convertedData.city}
              chartData={calculateTaxesChartData(data, convertedData)}
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-medium">Expenses</h3>
            <MoneyBarChart
              localCity={data.city}
              remoteCity={convertedData.city}
              chartData={calculateExpensesChartData(data, convertedData)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function useScrollIntoView() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);
  return { ref };
}

function convertCOLAndFindSalary(
  data: CostOfLiving,
  remoteCity: City,
  cityHousing: CityHousing,
): CostOfLiving {
  const newData: CostOfLiving = {
    ...data,
    city: remoteCity,
    expenses: parseExpenses(data, remoteCity, cityHousing),
  };

  const localSavingsRate = calculateNetTakeHomePay(data).savingsRate;
  const remoteSalaryNeeded = secantMethod(
    blackBox(newData, localSavingsRate),
    1,
    1_000_000,
  );

  newData.salary = remoteSalaryNeeded;

  return newData;
}

function blackBox(formBase: CostOfLiving, target: number) {
  return (x: number) => {
    const newForm = {
      ...formBase,
      salary: x,
    };
    const newSavings = calculateNetTakeHomePay(newForm).savingsRate;
    const requiredSalary = (newSavings - target) * x;
    return requiredSalary;
  };
}

function barChartConfig(localCity: City, remoteCity: City): ChartConfig {
  return {
    local: {
      label: localCity,
      color: "#FFFFFF",
    },
    remote: {
      label: remoteCity,
      color: "#00FFFF",
    },
  } satisfies ChartConfig;
}

function parseExpenses(
  data: CostOfLiving,
  remoteCity: City,
  cityHousing: CityHousing,
): CostOfLiving["expenses"] {
  const cityHousingOverride = cityHousing ? cityHousing[remoteCity] : undefined;
  return {
    housing: cityHousingOverride
      ? cityHousingOverride
      : convertCostOfLiving(
          data.expenses.housing,
          data.city,
          remoteCity,
          "Housing",
        ),
    transportaiton: convertCostOfLiving(
      data.expenses.transportaiton,
      data.city,
      remoteCity,
      "Transportation",
    ),
    miscellaneous: convertCostOfLiving(
      data.expenses.miscellaneous,
      data.city,
      remoteCity,
      "Miscellaneous",
    ),
    fixed: convertCostOfLiving(
      data.expenses.fixed,
      data.city,
      remoteCity,
      "Fixed",
    ),
  };
}

function calculateExpensesChartData(
  localData: CostOfLiving,
  remoteData: CostOfLiving,
) {
  return [
    {
      name: "Housing",
      local: localData.expenses.housing,
      remote: remoteData.expenses.housing,
    },
    {
      name: "Transportation",
      local: localData.expenses.transportaiton,
      remote: remoteData.expenses.transportaiton,
    },
    {
      name: "Miscellaneous",
      local: localData.expenses.miscellaneous,
      remote: remoteData.expenses.miscellaneous,
    },
    {
      name: "Fixed",
      local: localData.expenses.fixed,
      remote: remoteData.expenses.fixed,
    },
  ];
}

function calculateTaxesChartData(
  localData: CostOfLiving,
  remoteData: CostOfLiving,
) {
  const localTaxes = calculateNetTakeHomePay(localData);
  const remoteTaxes = calculateNetTakeHomePay(remoteData);

  return [
    {
      name: "Federal",
      local: localTaxes.fedTax,
      remote: remoteTaxes.fedTax,
    },
    {
      name: "State",
      local: localTaxes.stateTax,
      remote: remoteTaxes.stateTax,
    },
    {
      name: "City",
      local: localTaxes.cityTax,
      remote: remoteTaxes.cityTax,
    },
    {
      name: "Social",
      local: localTaxes.socialSecurity,
      remote: remoteTaxes.socialSecurity,
    },
    {
      name: "Medicare",
      local: localTaxes.medicare,
      remote: remoteTaxes.medicare,
    },
  ];
}

type ChartData = {
  name: string;
  local: number;
  remote: number;
};
function MoneyBarChart({
  localCity,
  remoteCity,
  chartData,
}: {
  localCity: City;
  remoteCity: City;
  chartData: ChartData[];
}) {
  return (
    <ChartContainer
      config={barChartConfig(localCity, remoteCity)}
      className="w-full h-[200px]"
    >
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <YAxis
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={formatMoney}
        />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              valueFormatter={(v) => formatMoney(Number(v))}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="local" fill="var(--color-local)" radius={4} />
        <Bar dataKey="remote" fill="var(--color-remote)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

function convertCostOfLiving(
  value: number,
  localCity: City,
  remoteCity: City,
  category: Category,
): number {
  if (category == "Fixed") {
    return value;
  }

  const localCOL = COST_OF_LIVING[localCity][category];
  const remoteCOL = COST_OF_LIVING[remoteCity][category];
  return value * (remoteCOL / localCOL);
}

function calculateNetTakeHomePay(data: CostOfLiving) {
  const fedRate = FED_LIMITS.rates;
  const city = data.city;
  const state = CITY_INFO[city].state;
  const cityRate = CITY_TAX[city];
  const stateRate = STATE_TAX[state];

  const preTaxIncome = data.salary;
  const deductions = FED_LIMITS.standardDeduction;
  const socialSecurity = preTaxIncome * FED_LIMITS.socialSecurity;
  const medicare = preTaxIncome * FED_LIMITS.medicare;

  // maybe we could assume some percentage of pre-tax investment?
  // like match > hsa > roth > max?
  const taxableIncome = preTaxIncome - deductions;

  const fedTax = calculateTax(taxableIncome, fedRate, data.status);
  const stateTax = calculateTax(taxableIncome, stateRate, data.status);
  const cityTax = calculateTax(taxableIncome, cityRate, data.status);

  const expenses = 12 * calculateExpenses(data.expenses);

  const netTakeHome =
    preTaxIncome -
    fedTax -
    stateTax -
    cityTax -
    socialSecurity -
    medicare -
    expenses;

  const savingsRate = netTakeHome / data.salary;

  return {
    netTakeHome,
    preTaxIncome,
    fedTax,
    stateTax,
    cityTax,
    socialSecurity,
    medicare,
    expenses,
    savingsRate,
  };
}

function calculateExpenses(expenses: CostOfLiving["expenses"]) {
  return (
    expenses.housing +
    expenses.transportaiton +
    expenses.miscellaneous +
    expenses.fixed
  );
}

function calculateTax(income: number, tax: Tax, status: TaxStatus): number {
  if (!tax) return 0;
  switch (tax.type) {
    case "status-based":
      return calculateTax(income, tax.status[status], status);
    case "bracket":
      return Object.entries(tax.brackets).reduce((acc, [bracket, rate]) => {
        const bracketAmount = Math.min(income, Number(bracket));
        acc += bracketAmount * rate;
        income -= bracketAmount;
        return acc;
      }, 0);
    case "percentage":
      return income * tax.rate;
    case "flat":
      return tax.rate;
  }
}
