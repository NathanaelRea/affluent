import { Button } from "./components/ui/button";
import { Form, FormLabel } from "./components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { Label } from "./components/ui/label";
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
import { ChevronsUp, Minus, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import {
  cities,
  Tax,
  TAX_STATUS,
  TaxStatus,
  taxStatusSchema,
  citySchema,
  City,
  Category,
  CITIES,
  states,
} from "./data";
import { FIELD } from "./components/FIELD";
import { expensesSchema } from "./components/tables/expenses/columns";
import { DataTable } from "./components/tables/basic-table";
import { expenseColumns } from "./components/tables/expenses/columns";
import { FED_TAX, CITY_TAX, STATE_TAX, COST_OF_LIVING } from "./data2024";
import { InputWithFormatRHF } from "./components/InputWithFormat";

const formSchema = z
  .object({
    city: citySchema,
    status: taxStatusSchema,
    age: z.coerce.number(),
    salary: z.coerce.number(),
    fourOhOneK: z.coerce.number().min(0).max(1, "Maximum of 100%"),
    hsaContribution: z.coerce.number(),
    rothIRAContribution: z.coerce.number(),
    afterTaxInvestments: z.coerce.number(),
    expenses: z.array(expensesSchema),
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
  });

function calculateModifiedAGI(data: MyForm) {
  const standardDeduction = FED_TAX.standardDeduction;
  return (
    data.salary - standardDeduction - data.hsaContribution - data.fourOhOneK
  );
}

function rothIRALimit(data: MyForm) {
  const modifiedAGI = calculateModifiedAGI(data);
  const { range, limit, limit50 } = FED_TAX.rothIRAMaxContribution;
  const { low, high } = range[data.status];
  const maxContributionForAge = data.age >= 50 ? limit50 : limit;
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

function hsaLimit(data: MyForm) {
  return FED_TAX.hsaMaxContribution[data.status];
}

type MyForm = z.infer<typeof formSchema>;

const DEFAULT_VALUES: MyForm = {
  city: "Philadelphia",
  status: "Single",
  salary: 100_000,
  age: 30,
  fourOhOneK: 0.05,
  hsaContribution: 1_000,
  rothIRAContribution: 4_810,
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
};

export default function COL() {
  const defaultValues = loadFromLocalStorage()?.data ?? DEFAULT_VALUES;

  function resetDefaults() {
    saveToLocalStorage(DEFAULT_VALUES);
    window.location.reload(); // this is kinda dumb
  }

  return <Inner defaultValues={defaultValues} resetDefaults={resetDefaults} />;
}

function Inner({
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

  const onSubmit = (data: MyForm) => {
    setData(data);
    saveToLocalStorage(data);
  };

  const maxHsa = hsaLimit(form.getValues());
  const maxRoth = rothIRALimit(form.getValues());

  return (
    <div className="flex flex-col justify-center items-center p-4 h-full">
      <main className="flex flex-col max-w-4xl w-full">
        <h1 className="text-2xl">Cost of living in depth</h1>
        <h2 className="text-gray-400 px-4">
          Compare cost of living with in depth analysis. Using
          (federal/state/city) taxes, category based cost of living adjustments,
          and more!
        </h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="py-8">
            <FormLabel>Filing Status</FormLabel>
            <div>
              <Combobox
                disabled
                name="status"
                items={TAX_STATUS.map((status) => ({
                  value: status,
                  label: status,
                }))}
                value="Single"
                setValue={() => {}}
              />
            </div>
            <FormLabel>City</FormLabel>
            <div>
              <Combobox
                disabled
                name="city"
                items={CITIES.map((c) => ({
                  label: `${c}, ${states[cities[c].state].abbreviation}`,
                  value: c,
                }))}
                value={"Philadelphia"}
                setValue={() => {}}
              />
            </div>
            <FIELD form={form} formKey="age" label="Age" />
            <h2 className="text-xl">Income</h2>
            <InputWithFormatRHF
              form={form}
              formKey="salary"
              label="Salary"
              type="money"
            />
            <InputWithFormatRHF
              form={form}
              formKey="fourOhOneK"
              label="401(k)"
              type="percentage"
            />
            <InputWithFormatRHF
              form={form}
              formKey="hsaContribution"
              label={
                <div className="flex gap-2 items-center">
                  HSA
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Set to max"
                    onClick={() =>
                      form.setValue(
                        "hsaContribution",
                        hsaLimit(form.getValues()),
                      )
                    }
                  >
                    {maxHsa == form.getValues("hsaContribution") ? (
                      <Minus />
                    ) : (
                      <ChevronsUp />
                    )}
                  </Button>
                </div>
              }
              type="money"
            />
            <InputWithFormatRHF
              form={form}
              formKey="rothIRAContribution"
              label={
                <div className="flex gap-2 items-center">
                  Roth IRA
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Set to max"
                    onClick={() =>
                      form.setValue(
                        "rothIRAContribution",
                        rothIRALimit(form.getValues()).maxRoth,
                      )
                    }
                  >
                    {maxRoth.maxRoth ==
                    form.getValues("rothIRAContribution") ? (
                      <Minus />
                    ) : (
                      <ChevronsUp />
                    )}
                  </Button>
                </div>
              }
              type="money"
            />
            <InputWithFormatRHF
              form={form}
              formKey="afterTaxInvestments"
              label="After tax investments"
              type="money"
            />
            <h2 className="text-xl">Expenses</h2>
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

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={resetDefaults}>
                Reset
              </Button>
              <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
                Submit
              </Button>
            </div>
          </form>
        </Form>
        {data && <Results data={data} />}
      </main>
    </div>
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
  const convertedData = convertCOLAndFindSalary(data, remoteCity);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (data.rothIRAContribution != convertedData.rothIRAContribution) {
      toast.warning(
        `Roth IRA contribution has been adjusted from ${formatMoney(
          data.rothIRAContribution,
        )} to ${formatMoney(
          convertedData.rothIRAContribution,
        )}. The excess has been put in after tax investments.`,
      );
    }
  }, [data.rothIRAContribution, convertedData]);

  return (
    <div>
      <h2 className="text-xl" ref={resultsRef}>
        Results
      </h2>
      <div>
        <Combobox
          name="city"
          items={CITIES.map((c) => ({
            label: `${c}, ${states[cities[c].state].abbreviation}`,
            value: c,
          }))}
          value={remoteCity}
          setValue={(c) => setRemoteCity(c as City)}
        />
      </div>
      <Label>Required Income</Label>
      <h2 className="text-2xl">{formatMoney(convertedData.salary)}</h2>
      <h2 className="text-xl">Overview</h2>
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
    expenses: data.expenses.map((e) => ({
      ...e,
      amount: convertCostOfLiving(e.amount, data.city, remoteCity, e.category),
    })),
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
      name: "Expenses",
      local: localTaxes.expenses,
      remote: remoteTaxes.expenses,
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
  const state = cities[city].state;
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
