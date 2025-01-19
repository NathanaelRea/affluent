import { Button } from "./components/ui/button";
import { Form } from "./components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { formatMoney, secantMethod } from "./lib/utils";
import { Combobox } from "./components/combobox";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "./components/ui/chart";
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
} from "./data";
import { Expense, expenseSchema } from "./components/tables/expenses/columns";
import { DataTable } from "./components/tables/basic-table";
import { expenseColumns } from "./components/tables/expenses/columns";
import { FED_TAX, CITY_TAX, STATE_TAX, COST_OF_LIVING } from "./data2024";
import { InputRHF, InputWithFormat } from "./components/InputRHF";
import { ComboboxRHF } from "./components/ComboboxRHF";
import { SelectRHF } from "./components/SelectRHF";
import ErrorMessage from "./components/ErrorMessage";
import { TooltipHelp } from "./components/TooltipHelp";

const formSchema = z
  .object({
    city: citySchema,
    status: taxStatusSchema,
    age: agesSchema,
    salary: z.coerce.number(),
    fourOhOneK: z.coerce.number().min(0).max(1, "Maximum of 100%"),
    hsaContribution: z.coerce.number(),
    rothIRAContribution: z.coerce.number(),
    afterTaxInvestments: z.coerce.number(),
    expenses: z.array(expenseSchema),
    customHousing: z.record(citySchema, z.number()),
  })
  .superRefine((data, ctx) => {
    const rothLimit = rothIRALimit(data);
    if (data.rothIRAContribution > rothLimit.maxRoth) {
      ctx.addIssue({
        message: `Your Roth IRA contribution cannot exceed ${formatMoney(
          rothLimit.maxRoth,
        )} since your modified AGI is ${formatMoney(rothLimit.modifiedAGI)}`,
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

    const agi = rothLimit.modifiedAGI;
    const totalExpenses = data.expenses.reduce(
      (acc, val) => acc + val.amount * 12,
      0,
    );
    if (agi - data.rothIRAContribution - totalExpenses < 0) {
      ctx.addIssue({
        message: `Expenses and investments cannot exceed modified gross income (${formatMoney(agi)}).`,
        path: ["expenses"],
        code: "invalid_arguments",
        fatal: true,
        argumentsError: new z.ZodError([]),
      });
    }
  });

function calculateModifiedAGI(data: {
  salary: number;
  hsaContribution: number;
  fourOhOneK: number;
}) {
  const standardDeduction = FED_TAX.standardDeduction;
  return (
    data.salary -
    standardDeduction -
    data.hsaContribution -
    data.salary * data.fourOhOneK
  );
}
function rothIRALimit(data: {
  salary: number;
  hsaContribution: number;
  fourOhOneK: number;
  status: TaxStatus;
  age: Age;
}) {
  const modifiedAGI = calculateModifiedAGI(data);
  const { range, limit, catchupContribution } = FED_TAX.rothIRAMaxContribution;
  const { low, high } = range[data.status];
  const maxContributionForAge =
    data.age == "< 50" ? limit : limit + catchupContribution;
  const maxRoth =
    modifiedAGI <= low
      ? maxContributionForAge
      : modifiedAGI >= high
        ? 0
        : maxContributionForAge -
          (modifiedAGI - low) * (maxContributionForAge / (high - low));
  return {
    modifiedAGI,
    maxRoth,
  };
}

function hsaLimit(data: { status: TaxStatus; age: Age }) {
  const catchupContribution = FED_TAX.hsaMaxContribution.catchupContribution;
  const contribution = FED_TAX.hsaMaxContribution.contribution[data.status];
  return data.age == ">= 55"
    ? contribution + catchupContribution
    : contribution;
}

type MyForm = z.infer<typeof formSchema>;

const DEFAULT_VALUES: MyForm = {
  city: "Philadelphia",
  status: "Single",
  salary: 100_000,
  age: "< 50",
  fourOhOneK: 0.05,
  hsaContribution: 1_000,
  rothIRAContribution: 7_000,
  afterTaxInvestments: 0,
  expenses: [
    { name: "Rent", amount: 1_000, category: "Housing" },
    { name: "Renter's Insurance", amount: 10, category: "Housing" },
    { name: "Food", amount: 300, category: "Grocery" },
    { name: "Utilities", amount: 100, category: "Utilities" },
    { name: "Car", amount: 500, category: "Transportation" },
    { name: "Entertainment", amount: 100, category: "Miscellaneous" },
    { name: "Misc", amount: 100, category: "Miscellaneous" },
  ],
  customHousing: {},
};

export default function CostOfLivingWrapped() {
  const defaultValues = loadFromLocalStorage()?.data ?? DEFAULT_VALUES;

  function resetDefaults() {
    saveToLocalStorage(DEFAULT_VALUES);
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
  defaultValues: MyForm | undefined;
  resetDefaults: () => void;
}) {
  const [data, setData] = useState<MyForm | undefined>();

  const form = useForm<MyForm>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  function onSubmit(data: MyForm) {
    setData(data);
    saveToLocalStorage(data);
  }

  const status = form.watch("status");
  const age = form.watch("age");
  const salary = form.watch("salary");
  const fourOhOneK = form.watch("fourOhOneK");

  const maxHsa = hsaLimit({ status, age });
  const hsaContribution = form.watch("hsaContribution");
  const isHsaMax = hsaContribution == maxHsa;

  const maxRoth = rothIRALimit({
    salary,
    hsaContribution,
    fourOhOneK,
    status,
    age,
  });
  const currentRoth = form.watch("rothIRAContribution");
  const isRothMax = currentRoth == maxRoth.maxRoth;

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
            formKey="fourOhOneK"
            label="401(k)"
            type="percentage"
          />
          <InputRHF
            form={form}
            formKey="hsaContribution"
            label={
              <>
                HSA
                <Button
                  className="text-xs py-0 p-0 px-2"
                  type="button"
                  variant="ghost"
                  size={null}
                  title="Set to max"
                  disabled={isHsaMax}
                  onClick={() => form.setValue("hsaContribution", maxHsa)}
                >
                  {isHsaMax ? "Max" : "(not max)"}
                </Button>
              </>
            }
            type="money"
          />
          <InputRHF
            form={form}
            formKey="rothIRAContribution"
            label={
              <>
                Roth IRA
                <Button
                  className="text-xs py-0 p-0 px-2"
                  type="button"
                  variant="ghost"
                  size={null}
                  title="Set to max"
                  disabled={isRothMax}
                  onClick={() =>
                    form.setValue("rothIRAContribution", maxRoth.maxRoth)
                  }
                >
                  {isRothMax ? "Max" : "(not max)"}
                </Button>
              </>
            }
            type="money"
          />
          <InputRHF
            form={form}
            formKey="afterTaxInvestments"
            label="After tax investments"
            type="money"
          />
          <div className="md:col-span-2">
            <DataTable
              data={form.watch("expenses")}
              columns={expenseColumns}
              setValue={(name, value) => {
                // this is kinda dumb
                form.setValue(
                  name as
                    | `expenses.${number}.category`
                    | `expenses.${number}.amount`
                    | `expenses.${number}.name`,
                  value,
                );
              }}
              deleteRow={(rowIndex: number) => {
                const expenses = form.getValues("expenses");
                form.setValue(
                  "expenses",
                  expenses.filter((_, i) => i != rowIndex),
                );
              }}
            />
            <Button
              size={"sm"}
              variant={"outline"}
              type="button"
              className="w-full"
              onClick={() => {
                const expenses = form.getValues("expenses");
                form.setValue("expenses", [
                  ...expenses,
                  {
                    name: `Expense ${expenses.length + 1}`,
                    amount: 100,
                    category: "Miscellaneous",
                  },
                ]);
              }}
            >
              <PlusIcon />
            </Button>
          </div>
          <ErrorMessage message={form.formState.errors?.expenses?.message} />
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

const LOCAL_STORAGE_KEY = "finance-data";

function createLocalStorageWrapperSchema<T extends z.ZodTypeAny>(schema: T) {
  return z.object({
    version: z.number(),
    data: schema,
  });
}

const formWrapped = createLocalStorageWrapperSchema(formSchema);
type MyFormWrapped = z.infer<typeof formWrapped>;

function saveToLocalStorage(data: MyForm) {
  try {
    const dataWrapped = formWrapped.parse({ version: 1, data });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataWrapped));
  } catch {
    console.error("Failed to save to local storage");
  }
}

function loadFromLocalStorage(): MyFormWrapped | undefined {
  try {
    const rawData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!rawData) return undefined;
    return formWrapped.parse(JSON.parse(rawData));
  } catch {
    return undefined;
  }
}

function Results({ data }: { data: MyForm }) {
  const [remoteCity, setRemoteCity] = useState<City>("San Francisco");
  const [customHousing, setCustomHousing] = useState<number | undefined>(
    data.customHousing[remoteCity],
  );
  const newData = {
    ...data,
    customHousing: { ...data.customHousing, [remoteCity]: customHousing },
  };
  const convertedData = convertCOLAndFindSalary(newData, remoteCity);
  const resultsRef = useRef<HTMLDivElement>(null);
  const customHousingRef = useRef<HTMLInputElement>(null);

  function handleCity(c: City) {
    setRemoteCity(c);
    setCustomHousing(data.customHousing[c]);
  }

  function addCustomHousing() {
    const currentRent = data.expenses.reduce((acc, val) => {
      if (val.category == "Housing") {
        return Math.max(acc, val.amount);
      }
      return acc;
    }, 0);
    setCustomHousing(currentRent);
    customHousingRef.current?.focus();
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
              <TooltipHelp text="There could be a 5x cost of living adjustment for housing (e.g. Pittsburgh <-> Manhattan), however in that case you will probably upsize/downsize.">
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
      <div className="flex flex-col items-end">
        <span className="text-sm text-muted-foreground">Required Income</span>
        <h2 className="text-2xl">{formatMoney(convertedData.salary)}</h2>
      </div>
      <OverviewChart localData={data} remoteData={convertedData} />
      <ExpensesChart localData={data} remoteData={convertedData} />
    </div>
  );
}

function convertCOLAndFindSalary(data: MyForm, remoteCity: City): MyForm {
  const localAfterTax = data.rothIRAContribution + data.afterTaxInvestments;
  const dataNoAfterTax: MyForm = {
    ...data,
    rothIRAContribution: 0,
    afterTaxInvestments: 0,
  };
  const newData: MyForm = {
    ...dataNoAfterTax,
    city: remoteCity,
    expenses: parseExpenses(data, remoteCity),
  };

  const localNetTakeHomePay =
    calculateNetTakeHomePay(dataNoAfterTax).netTakeHome;
  const remoteSalaryNeeded = secantMethod(
    blackBox(newData, localNetTakeHomePay),
    0,
    1_000_000,
  );

  newData.salary = remoteSalaryNeeded;
  const newRothLimit = rothIRALimit(newData).maxRoth;
  newData.rothIRAContribution = Math.min(localAfterTax, newRothLimit);
  newData.afterTaxInvestments = localAfterTax - newData.rothIRAContribution;
  return newData;
}

function parseExpenses(data: MyForm, remoteCity: City) {
  const newExpenses = data.expenses.map((e) => ({
    ...e,
    amount: convertCostOfLiving(e.amount, data.city, remoteCity, e.category),
  }));
  const customHousing = data.customHousing[remoteCity];
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
  if (housing[0]) {
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

function blackBox(formBase: MyForm, localNetTakeHomePay: number) {
  return (x: number) => {
    const newForm = {
      ...formBase,
      salary: x,
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

function ExpensesChart({
  localData,
  remoteData,
}: {
  localData: MyForm;
  remoteData: MyForm;
}) {
  const chartData = localData.expenses.map((expense, index) => ({
    name: expense.name,
    local: expense.amount,
    remote: remoteData.expenses[index].amount,
  }));

  return (
    <ChartContainer
      config={barChartConfig(localData.city, remoteData.city)}
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

function OverviewChart({
  localData,
  remoteData,
}: {
  localData: MyForm;
  remoteData: MyForm;
}) {
  const localTaxes = calculateNetTakeHomePay(localData);
  const remoteTaxes = calculateNetTakeHomePay(remoteData);

  const chartData = [
    {
      name: "Federal tax",
      local: localTaxes.fedTax,
      remote: remoteTaxes.fedTax,
    },
    {
      name: "State tax",
      local: localTaxes.stateTax,
      remote: remoteTaxes.stateTax,
    },
    {
      name: "City tax",
      local: localTaxes.cityTax,
      remote: remoteTaxes.cityTax,
    },
    {
      name: "Social Security",
      local: localTaxes.socialSecurity,
      remote: remoteTaxes.socialSecurity,
    },
    {
      name: "Medicare",
      local: localTaxes.medicare,
      remote: remoteTaxes.medicare,
    },
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

  return (
    <ChartContainer
      config={barChartConfig(localData.city, remoteData.city)}
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
  const localCOL = COST_OF_LIVING[localCity][category];
  const remoteCOL = COST_OF_LIVING[remoteCity][category];
  if (!localCOL || !remoteCOL) {
    throw new Error("Invalid city id");
  }
  return value * (remoteCOL / localCOL);
}

function calculateNetTakeHomePay(data: MyForm) {
  const fedRate = FED_TAX.rates;
  const city = data.city;
  const state = CITY_INFO[city].state;
  const cityRate = CITY_TAX[city];
  const stateRate = STATE_TAX[state];

  const preTaxIncome = data.salary;
  const deductions = FED_TAX.standardDeduction;
  const socialSecurity = preTaxIncome * FED_TAX.socialSecurity;
  const medicare = preTaxIncome * FED_TAX.medicare;

  // Assume within limit (already validated)
  const roth = data.rothIRAContribution;
  const afterTaxInvestments = data.afterTaxInvestments;

  // Assume all trad
  const fourOhOneK = data.salary * data.fourOhOneK;
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
