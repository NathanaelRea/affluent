import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useCallback, useEffect, useRef, useState } from "react";
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
  AGES,
  agesSchema,
  Age,
} from "@/data";
import { Expense, expenseSchema } from "@/components/tables/expenses/columns";
import { FED_LIMITS, CITY_TAX, STATE_TAX, COST_OF_LIVING } from "@/data2024";
import { InputRHF, InputWithFormat } from "@/components/InputRHF";
import { ComboboxRHF } from "@/components/ComboboxRHF";
import { SelectRHF } from "@/components/SelectRHF";
import { TooltipHelp } from "@/components/TooltipHelp";
import { toast } from "sonner";

export const Route = createFileRoute("/cost-of-living")({
  component: CostOfLivingWrapped,
});

const cityHousingSchema = z.record(citySchema, z.number());
type CityHousing = z.infer<typeof cityHousingSchema>;

const costOfLivingSchema = z
  .object({
    city: citySchema,
    status: taxStatusSchema,
    age: agesSchema,
    salary: z.coerce.number(),
    fourOhOneKPercent: z.coerce.number().min(0).max(1, "Maximum of 100%"),
    hsaContribution: z.coerce.number(),
    rothIRAContribution: z.coerce.number(),
    afterTaxInvestments: z.coerce.number(),
    expenses: z.array(expenseSchema),
  })
  .superRefine((data, ctx) => {
    const limit401k = fourOhOneKLimit(data);
    const contrib401k = data.salary * data.fourOhOneKPercent;
    if (contrib401k > limit401k) {
      const max401kPercent = limit401k / data.salary;
      ctx.addIssue({
        message: `Your 401(k) contribution cannot exceed ${formatMoney(
          limit401k,
        )} (${formatPercent(max401kPercent)})`,
        path: ["fourOhOneKPercent"],
        code: "invalid_arguments",
        argumentsError: new z.ZodError([]),
      });
    }
    const modifiedAGI = calculateModifiedAGI(data);
    const rothLimit = rothIRALimit({ ...data, modifiedAGI });
    if (data.rothIRAContribution > rothLimit) {
      ctx.addIssue({
        message: `Your Roth IRA contribution cannot exceed ${formatMoney(
          rothLimit,
        )} since your modified AGI is ${formatMoney(modifiedAGI)}`,
        path: ["rothIRAContribution"],
        code: "invalid_arguments",
        argumentsError: new z.ZodError([]),
      });
    }
    const hsaMax = hsaLimit(data);
    if (data.hsaContribution > hsaMax) {
      ctx.addIssue({
        message: `Your HSA contribution cannot exceed ${formatMoney(hsaMax)}`,
        path: ["hsaContribution"],
        code: "invalid_arguments",
        argumentsError: new z.ZodError([]),
      });
    }

    const totalExpenses = data.expenses.reduce(
      (acc, val) => acc + val.amount * 12,
      0,
    );
    if (modifiedAGI - data.rothIRAContribution - totalExpenses < 0) {
      ctx.addIssue({
        message: `Expenses and investments cannot exceed modified gross income (${formatMoney(modifiedAGI)}).`,
        path: ["expenses"],
        code: "invalid_arguments",
        fatal: true,
        argumentsError: new z.ZodError([]),
      });
    }
  });
type CostOfLiving = z.infer<typeof costOfLivingSchema>;

function calculateModifiedAGI(data: {
  salary: number;
  hsaContribution: number;
  fourOhOneKPercent: number;
}) {
  const standardDeduction = FED_LIMITS.standardDeduction;
  return (
    data.salary -
    standardDeduction -
    data.hsaContribution -
    data.salary * data.fourOhOneKPercent
  );
}

function fourOhOneKLimit(data: { age: Age }) {
  const limit = FED_LIMITS.fourOhOneKContribution.limit;
  if (data.age == "< 50") return limit;
  else {
    return limit + FED_LIMITS.fourOhOneKContribution.catchupContribution50;
  }
}

function rothIRALimit(data: {
  modifiedAGI: number;
  status: TaxStatus;
  age: Age;
}) {
  const { range, limit, catchupContribution } =
    FED_LIMITS.rothIRAMaxContribution;
  const { low, high } = range[data.status];
  const maxContributionForAge =
    data.age == "< 50" ? limit : limit + catchupContribution;
  const maxRoth =
    data.modifiedAGI <= low
      ? maxContributionForAge
      : data.modifiedAGI >= high
        ? 0
        : maxContributionForAge -
          (data.modifiedAGI - low) * (maxContributionForAge / (high - low));
  return maxRoth;
}

function hsaLimit(data: { status: TaxStatus; age: Age }) {
  const catchupContribution = FED_LIMITS.hsaMaxContribution.catchupContribution;
  const contribution = FED_LIMITS.hsaMaxContribution.contribution[data.status];
  return data.age == ">= 55"
    ? contribution + catchupContribution
    : contribution;
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

  const form = useForm<CostOfLiving>({
    resolver: zodResolver(costOfLivingSchema),
    defaultValues,
  });

  function onSubmit(data: CostOfLiving) {
    setData(data);
    saveToLocalStorage(STORAGE.finance, data);
  }

  const status = form.watch("status");
  const age = form.watch("age");

  const maxHsa = hsaLimit({ status, age });
  const hsaContribution = form.watch("hsaContribution");
  const isHsaMax = hsaContribution == maxHsa;

  const salary = form.watch("salary");
  const fourOhOneKPercent = form.watch("fourOhOneKPercent");

  const modifiedAGI = calculateModifiedAGI({
    salary,
    fourOhOneKPercent,
    hsaContribution,
  });

  const maxRoth = rothIRALimit({
    modifiedAGI,
    status,
    age,
  });
  const currentRoth = form.watch("rothIRAContribution");
  const isRothMax = currentRoth == maxRoth;

  const expenses = form.watch("expenses");
  // TODO fix: need Number() right now because expenses setting as string?
  const totalMoExpenses = expenses.reduce(
    (acc, val) => acc + Number(val.amount),
    0,
  );
  const netTakeHome = data ? calculateNetTakeHomePay(data).netTakeHome : 0;
  const netSavings = data ? calculateSavingsRate(data) : 0;

  return (
    <>
      <h1 className="text-2xl">Cost of living in depth</h1>
      <h2 className="text-gray-400 text-pretty">
        Compare cost of living between cities with in depth analysis. Using
        (federal/state/city) taxes, category based cost of living adjustments,
        and more!
      </h2>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 py-8"
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
          <SelectRHF
            form={form}
            formKey="age"
            label={
              <TooltipHelp text="Used to determine max Roth/HSA contribution">
                Age
              </TooltipHelp>
            }
            items={AGES.map((c) => ({
              label: c,
              value: c,
            }))}
          />
          <InputRHF form={form} formKey="salary" label="Salary" type="money" />
          <InputRHF
            form={form}
            formKey="fourOhOneKPercent"
            label="401(k)"
            type="percentage"
          />
          <InputRHF
            form={form}
            formKey="hsaContribution"
            label={
              <div className="flex items-center gap-2 py-1">
                HSA
                <Button
                  className="text-xs py-0 p-0 px-1"
                  type="button"
                  size={null}
                  disabled={isHsaMax}
                  onClick={() => form.setValue("hsaContribution", maxHsa)}
                >
                  {isHsaMax ? "Max" : "set to max"}
                </Button>
              </div>
            }
            type="money"
          />
          <InputRHF
            form={form}
            formKey="rothIRAContribution"
            label={
              <div className="flex items-center gap-2 py-1">
                Roth IRA
                <Button
                  className="text-xs py-0 p-0 px-1"
                  type="button"
                  size={null}
                  disabled={isRothMax}
                  onClick={() => form.setValue("rothIRAContribution", maxRoth)}
                >
                  {isRothMax ? "Max" : "set to max"}
                </Button>
              </div>
            }
            type="money"
          />
          <InputRHF
            form={form}
            formKey="afterTaxInvestments"
            label="After tax investments"
            type="money"
          />
          <div />
          <div className="md:col-span-2">Expenses</div>
          <InputRHF
            form={form}
            formKey="expenses.0.amount"
            label="Housing"
            type="money"
          />
          <InputRHF
            form={form}
            formKey="expenses.1.amount"
            label="Transportation"
            type="money"
          />
          <InputRHF
            form={form}
            formKey="expenses.2.amount"
            label="Other"
            type="money"
          />
          <InputRHF
            form={form}
            formKey="expenses.3.amount"
            label="Fixed"
            type="money"
          />
          <div className="flex flex-col md:col-span-2">
            <p className="text-sm text-muted-foreground text-right">
              Total expenses: {formatMoney(totalMoExpenses)}/mo
            </p>
            {data && (
              <>
                <p className="text-sm text-muted-foreground text-right">
                  Net take home: {formatMoney(netTakeHome / 12)}/mo
                </p>
                <p className="text-sm text-muted-foreground text-right">
                  Savings rate: {formatPercent(netSavings)}
                </p>
              </>
            )}
          </div>
          <div className="flex items-center justify-between md:col-span-2">
            <Button variant="outline" onClick={resetDefaults} type="button">
              Reset
            </Button>
            <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
              Submit
            </Button>
          </div>
        </form>
      </Form>
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
      age: "< 50",
      fourOhOneKPercent: 0.05,
      hsaContribution: 1_000,
      rothIRAContribution: 7_000,
      afterTaxInvestments: 0,
      expenses: [
        { name: "Rent", amount: 1_500, category: "Housing" },
        { name: "Car", amount: 500, category: "Transportation" },
        { name: "Other", amount: 2_500, category: "Miscellaneous" },
        { name: "Fixed", amount: 500, category: "Fixed" },
      ],
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
  const convertedData = convertCOLAndFindSalary(data, remoteCity, cityHousing);
  const resultsRef = useRef<HTMLDivElement>(null);

  const checkHousingRatio = useCallback(() => {
    if (customHousing) return;
    const MAX_RATIO = 2.5;
    const rent1 = getRent(data.expenses);
    const rent2 = getRent(convertedData.expenses);
    const ratio = rent1 / rent2;
    if (ratio >= MAX_RATIO || 1 >= ratio * MAX_RATIO) {
      toast.warning(
        `Cost of living adjustment for housing exceeds ${MAX_RATIO}x. To downsize/rightsize, set custom city housing.`,
      );
    }
  }, [customHousing, convertedData.expenses, data.expenses]);
  checkHousingRatio();

  function handleCity(c: City) {
    setRemoteCity(c);
    setCustomHousing(cityHousing[c]);
  }

  function addCustomHousing() {
    const remoteRent = getRent(convertedData.expenses);
    setCustomHousing(Math.round(remoteRent));
  }

  function removeCustomHousing() {
    setCustomHousing(undefined);
  }

  useEffect(() => {
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className="flex flex-col gap-2" ref={resultsRef}>
      <div className="flex justify-center w-full">
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          <label>Comparison City</label>
          <div>
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
            <label>
              <TooltipHelp text="There could be a 5x cost of living adjustment for housing (e.g. Pittsburgh <-> Manhattan), however in that case you will probably downsize/rightsize.">
                Custom City Housing
              </TooltipHelp>
            </label>
            {customHousing ? (
              <div className="flex gap-2 items-center">
                <InputWithFormat
                  value={customHousing}
                  onChange={(v) => setCustomHousing(v)}
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
              >
                <PlusIcon />
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end justify-end">
        <span className="text-sm text-muted-foreground">Required Income</span>
        <h2 className="text-2xl">{formatMoney(convertedData.salary)}</h2>
        <p className="text-xs text-muted-foreground text-right">
          To maintain the same net take home and savings rate
        </p>
      </div>
      <h3>Taxes</h3>
      <MoneyBarChart
        localCity={data.city}
        remoteCity={convertedData.city}
        chartData={calculateTaxesChartData(data, convertedData)}
      />
      <h3>Investments</h3>
      <MoneyBarChart
        localCity={data.city}
        remoteCity={convertedData.city}
        chartData={calculateInvestmentsChartData(data, convertedData)}
      />
      <h3>Expenses</h3>
      <MoneyBarChart
        localCity={data.city}
        remoteCity={convertedData.city}
        chartData={calculateExpensesChartData(data, convertedData)}
      />
    </div>
  );
}

function getRent(expenses: Expense[]) {
  return expenses.reduce((acc, val) => {
    if (val.category == "Housing") {
      return Math.max(acc, val.amount);
    }
    return acc;
  }, 0);
}

function convertCOLAndFindSalary(
  data: CostOfLiving,
  remoteCity: City,
  cityHousing: CityHousing,
): CostOfLiving {
  const localAfterTax = data.rothIRAContribution + data.afterTaxInvestments;
  const dataNoAfterTax: CostOfLiving = {
    ...data,
    rothIRAContribution: 0,
    afterTaxInvestments: 0,
  };
  const newData: CostOfLiving = {
    ...dataNoAfterTax,
    city: remoteCity,
    expenses: parseExpenses(data, remoteCity, cityHousing),
  };

  const localNetTakeHomePay =
    calculateNetTakeHomePay(dataNoAfterTax).netTakeHome;
  const remoteSalaryNeeded = secantMethod(
    blackBox(newData, localNetTakeHomePay),
    0,
    1_000_000,
  );

  newData.salary = remoteSalaryNeeded;
  const modifiedAGI = calculateModifiedAGI(data);
  const newRothLimit = rothIRALimit({ ...newData, modifiedAGI });
  newData.rothIRAContribution = Math.min(localAfterTax, newRothLimit);
  newData.afterTaxInvestments = localAfterTax - newData.rothIRAContribution;

  const limit401k = fourOhOneKLimit(data);
  const max401k = limit401k / newData.salary;
  const fourOhOneKPercent = Math.min(max401k, newData.fourOhOneKPercent);
  newData.fourOhOneKPercent = fourOhOneKPercent;

  return newData;
}

function parseExpenses(
  data: CostOfLiving,
  remoteCity: City,
  cityHousing: CityHousing,
) {
  const newExpenses = data.expenses.map((e) => ({
    ...e,
    amount: convertCostOfLiving(e.amount, data.city, remoteCity, e.category),
  }));
  const customHousing = cityHousing[remoteCity];
  if (!customHousing) {
    return newExpenses;
  }

  const housing: Expense[] = [];
  const nonHousing: Expense[] = [];
  for (const e of newExpenses) {
    if (e.category == "Housing") {
      housing.push(e);
    } else {
      nonHousing.push(e);
    }
  }
  housing.sort((a, b) => b.amount - a.amount);
  if (housing.at(0)) {
    housing[0] = { ...housing[0], amount: customHousing };
  } else {
    housing.push({
      name: "Housing",
      category: "Housing",
      amount: customHousing,
    });
  }
  return [...housing, ...nonHousing];
}

function blackBox(formBase: CostOfLiving, localNetTakeHomePay: number) {
  const og401k = formBase.fourOhOneKPercent;
  const limit401k = fourOhOneKLimit(formBase);
  return (x: number) => {
    const max401kPercent = limit401k / x;
    const fourOhOneKPercent = Math.min(og401k, max401kPercent);
    const newForm = {
      ...formBase,
      salary: x,
      fourOhOneKPercent,
    };
    return calculateNetTakeHomePay(newForm).netTakeHome - localNetTakeHomePay;
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

function calculateExpensesChartData(
  localData: CostOfLiving,
  remoteData: CostOfLiving,
) {
  return localData.expenses.map((expense, index) => ({
    name: expense.name,
    local: expense.amount,
    remote: remoteData.expenses[index].amount,
  }));
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

function calculateInvestmentsChartData(
  localData: CostOfLiving,
  remoteData: CostOfLiving,
) {
  const localTaxes = calculateNetTakeHomePay(localData);
  const remoteTaxes = calculateNetTakeHomePay(remoteData);

  return [
    {
      name: "401(k)",
      local: localTaxes.fourOhOneK,
      remote: remoteTaxes.fourOhOneK,
    },
    {
      name: "HSA",
      local: localTaxes.hsa,
      remote: remoteTaxes.hsa,
    },
    {
      name: "Roth IRA",
      local: localTaxes.rothIRAContribution,
      remote: remoteTaxes.rothIRAContribution,
    },
    {
      name: "After Tax",
      local: localTaxes.afterTaxInvestments,
      remote: remoteTaxes.afterTaxInvestments,
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

  // Assume within limit (already validated)
  const roth = data.rothIRAContribution;
  const afterTaxInvestments = data.afterTaxInvestments;

  // Assume all trad
  const fourOhOneK = data.salary * data.fourOhOneKPercent;
  const hsa = data.hsaContribution;

  const taxableIncome = preTaxIncome - deductions - fourOhOneK - hsa;

  const fedTax = calculateTax(taxableIncome, fedRate, data.status);
  const stateTax = calculateTax(taxableIncome, stateRate, data.status);
  const cityTax = calculateTax(taxableIncome, cityRate, data.status);

  const expenses =
    12 * data.expenses.reduce((acc, { amount }) => acc + amount, 0);

  const netTakeHome =
    preTaxIncome -
    fedTax -
    stateTax -
    cityTax -
    socialSecurity -
    medicare -
    fourOhOneK -
    hsa -
    roth -
    afterTaxInvestments -
    expenses;

  return {
    netTakeHome,
    preTaxIncome,
    fedTax,
    stateTax,
    cityTax,
    socialSecurity,
    medicare,
    fourOhOneK,
    hsa,
    expenses,
    rothIRAContribution: roth,
    afterTaxInvestments,
  };
}

function calculateSavingsRate(data: CostOfLiving) {
  const fourOhOneK = data.salary * data.fourOhOneKPercent;
  const investments =
    fourOhOneK +
    data.hsaContribution +
    data.rothIRAContribution +
    data.afterTaxInvestments;
  return investments / data.salary;
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
