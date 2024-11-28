import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldValues, Path, useForm, UseFormReturn } from "react-hook-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import { ReactNode, useState } from "react";
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
import { ChevronsUp, Minus } from "lucide-react";

// FIXME value/label object
const COL_CATEGORIES = [
  "Housing",
  "Transportation",
  "Grocery",
  "Utilities",
  "Healthcare",
  "Miscellaneous",
] as const;
type Category = (typeof COL_CATEGORIES)[number];

const costOfLivingSchema = z.object(
  COL_CATEGORIES.reduce((acc, key) => {
    acc[key] = z.coerce.number();
    return acc;
  }, {} as Record<Category, z.ZodNumber>)
);
type CostOfLiving = z.infer<typeof costOfLivingSchema>;

const expenseSchema = z.object({
  name: z.string(),
  amount: z.coerce.number(),
  type: z.enum(COL_CATEGORIES),
});

// FIXME value/label object
const TAX_STATUS = ["single", "married", "headOfHousehold"] as const;
const taxStatusSchema = z.enum(TAX_STATUS);

const stateSchema = z.enum(["CA", "PA"]);
const citySchema = z.enum([
  "San Francisco",
  "Los Angeles",
  "Philadelphia",
  "Pittsburgh",
]);
const formSchema = z
  .object({
    city: citySchema,
    status: taxStatusSchema,
    age: z.coerce.number(),
    salary: z.coerce.number(),
    fourOhOneK: z.coerce.number().min(0).max(1),
    hsaContribution: z.coerce.number(),
    rothIRAContribution: z.coerce.number(),
    expenses: z.array(expenseSchema),
  })
  .superRefine((data, ctx) => {
    const rothLimit = rothIRALimit(data);
    if (data.rothIRAContribution > rothLimit.maxRoth) {
      ctx.addIssue({
        message: `Your Roth IRA contribution cannot exceed ${formatMoney(
          rothLimit.maxRoth
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

function rothIRALimit(data: Form) {
  const standardDeduction = FED_TAX.standardDeduction;
  const modifiedAGI = data.salary - standardDeduction;
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

function hsaLimit(data: Form) {
  return FED_TAX.hsaMaxContribution[data.status];
}

type Form = z.infer<typeof formSchema>;

const DEFAULT_VALUES: Form = {
  city: "Philadelphia",
  status: "single",
  salary: 100_000,
  age: 30,
  fourOhOneK: 0.05,
  hsaContribution: 1_000,
  rothIRAContribution: 4_810,
  expenses: [
    { name: "Rent", amount: 1_000, type: "Housing" },
    { name: "Renter's Insurance", amount: 10, type: "Housing" },
    { name: "Food", amount: 300, type: "Grocery" },
    { name: "Utilities", amount: 100, type: "Utilities" },
    { name: "Car", amount: 500, type: "Transportation" },
    { name: "Entertainment", amount: 100, type: "Miscellaneous" },
    { name: "Misc", amount: 100, type: "Miscellaneous" },
  ],
};

function App() {
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
  defaultValues: Form | undefined;
  resetDefaults: () => void;
}) {
  const [data, setData] = useState<Form | undefined>();

  const form = useForm<Form>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = (data: Form) => {
    setData(data);
    saveToLocalStorage(data);
  };

  const maxHsa = hsaLimit(form.getValues());
  const maxRoth = rothIRALimit(form.getValues());

  return (
    <div className="flex flex-col justify-center items-center">
      <main className="flex flex-col max-w-3xl w-full">
        <h1 className="text-2xl">Finance thing</h1>
        <div>
          <Button variant="ghost" onClick={resetDefaults}>
            Clear
          </Button>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Combobox
              disabled
              name="status"
              items={TAX_STATUS.map((status) => ({
                value: status,
                label: status,
              }))}
              value="single"
              setValue={() => {}}
            />
            <Combobox
              disabled
              name="city"
              items={CITIES.map((c) => ({
                label: `${c.name}, ${c.stateAbbr}`,
                value: c.name,
              }))}
              value={"Philadelphia"}
              setValue={() => {}}
            />
            <FIELD form={form} formKey="age" label="Age" />
            <h2 className="text-xl">Income</h2>
            <FIELD form={form} formKey="salary" label="Salary" format />
            <FIELD form={form} formKey="fourOhOneK" label="401(k)" />
            <FIELD
              form={form}
              formKey="hsaContribution"
              label={
                <div className="flex gap-2 items-center">
                  HSA
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Set to max"
                    onClick={() =>
                      form.setValue(
                        "hsaContribution",
                        hsaLimit(form.getValues())
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
              format
            />
            <FIELD
              form={form}
              formKey="rothIRAContribution"
              label={
                <div className="flex gap-2 items-center">
                  Roth IRA
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Set to max"
                    onClick={() =>
                      form.setValue(
                        "rothIRAContribution",
                        rothIRALimit(form.getValues()).maxRoth
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
              format
            />
            <h2 className="text-xl">Expenses</h2>
            <ExpensesTable form={form} />
            <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
              Submit
            </Button>
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
type FormWrapped = z.infer<typeof formWrapped>;

function saveToLocalStorage(data: Form) {
  try {
    const dataWrapped = formWrapped.parse({ version: 1, data });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataWrapped));
  } catch {
    console.error("Failed to save to local storage");
  }
}

function loadFromLocalStorage(): FormWrapped | undefined {
  try {
    const rawData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!rawData) return undefined;
    return formWrapped.parse(JSON.parse(rawData));
  } catch {
    return undefined;
  }
}

function blackBox(formBase: Form, localNetTakeHomePay: number) {
  return (x: number) => {
    const form = {
      ...formBase,
      salary: x,
    };
    return calculateNetTakeHomePay(form) - localNetTakeHomePay;
  };
}

function convertCOLAndFindSalary(data: Form, remoteCity: City): Form {
  const newData = {
    ...data,
    city: remoteCity,
    expenses: data.expenses.map((e) => ({
      ...e,
      amount: convertCostOfLiving(e.amount, data.city, remoteCity, e.type),
    })),
  };

  const localNetTakeHomePay = calculateNetTakeHomePay(data);
  const remoteSalaryNeeded = secantMethod(
    blackBox(newData, localNetTakeHomePay),
    0,
    1_000_000
  );

  newData.salary = remoteSalaryNeeded;
  return newData;
}

function Results({ data }: { data: Form }) {
  const [remoteCity, setRemoteCity] = useState<City>(data.city);
  const convertedData = convertCOLAndFindSalary(data, remoteCity);

  const localNetTakeHomePay = calculateNetTakeHomePay(data);
  const remoteNetTakeHomePay = calculateNetTakeHomePay(convertedData);

  return (
    <div>
      <h2 className="text-xl">Results</h2>
      <div>
        <Combobox
          name="city"
          items={CITIES.map((c) => ({
            label: `${c.name}, ${c.stateAbbr}`,
            value: c.name,
          }))}
          value={remoteCity}
          setValue={(c) => setRemoteCity(c as City)}
        />
      </div>
      <Label>Required Income</Label>
      <Input value={formatMoney(convertedData.salary)} disabled />
      <h2 className="text-xl">Overview</h2>
      <OverviewChart localData={data} remoteData={convertedData} />
      <h2 className="text-xl">Expenses Breakdown</h2>
      <ExpensesChart localData={data} remoteData={convertedData} />
      <Label>Local Net Take Home Pay (yr, mo)</Label>
      <Input value={formatMoney(localNetTakeHomePay)} disabled />
      <Input value={formatMoney(localNetTakeHomePay / 12)} disabled />
      <Label>Remote Net Take Home Pay (yr, mo)</Label>
      <Input value={formatMoney(remoteNetTakeHomePay)} disabled />
      <Input value={formatMoney(remoteNetTakeHomePay / 12)} disabled />
    </div>
  );
}

function ExpensesChart({
  localData,
  remoteData,
}: {
  localData: Form;
  remoteData: Form;
}) {
  const chartData = localData.expenses.map((expense, index) => ({
    name: expense.name,
    local: expense.amount,
    remote: remoteData.expenses[index].amount,
  }));

  const chartConfig = {
    local: {
      label: localData.city,
      color: "#2563eb",
    },
    remote: {
      label: remoteData.city,
      color: "#60a5fa",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
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
  localData: Form;
  remoteData: Form;
}) {
  const localTaxes = calculateTaxesOBJECT(localData);
  const remoteTaxes = calculateTaxesOBJECT(remoteData);

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

  const chartConfig = {
    local: {
      label: localData.city,
      color: "#2563eb",
    },
    remote: {
      label: remoteData.city,
      color: "#60a5fa",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
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
  category: Category
): number {
  const local = COST_OF_LIVING[localCity][category];
  const remote = COST_OF_LIVING[remoteCity][category];
  return value * (remote / local);
}

function ExpensesTable({ form }: { form: UseFormReturn<Form> }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {form.watch("expenses").map((data, index) => (
          <TableRow key={index}>
            <TableCell>
              <FIELD form={form} formKey={`expenses.${index}.name`} />
            </TableCell>
            <TableCell>
              <Combobox
                name="category"
                items={COL_CATEGORIES.map((category) => ({
                  label: category,
                  value: category,
                }))}
                value={data.type}
                setValue={(v) => {
                  form.setValue(`expenses.${index}.type`, v as Category);
                }}
              />
            </TableCell>
            <TableCell>
              <FIELD form={form} formKey={`expenses.${index}.amount`} format />
            </TableCell>
          </TableRow>
        ))}
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell></TableCell>
          <TableCell>
            {formatMoney(
              form
                .watch("expenses")
                .reduce((acc, { amount }) => acc + Number(amount), 0)
            )}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

function calculateNetTakeHomePay(data: Form) {
  const fedRate = FED_TAX.rates;
  const state = cityToState[data.city];
  const stateRate = STATE_TAX[state];
  const cityRate = CITY_TAX[data.city];

  const preTaxIncome = data.salary;
  const deductions = FED_TAX.standardDeduction;
  const socialSecurity = preTaxIncome * FED_TAX.socialSecurity;
  const medicare = preTaxIncome * FED_TAX.medicare;

  // Assume all trad
  const fourOhOneKTraditional = data.salary * data.fourOhOneK;
  const hsa = data.hsaContribution;

  const taxableIncome = preTaxIncome - deductions - fourOhOneKTraditional - hsa;

  const fedTax = calculateTax(taxableIncome, fedRate, data.status);
  const stateTax = calculateTax(taxableIncome, stateRate, data.status);
  const cityTax = calculateTax(taxableIncome, cityRate, data.status);

  const expenses =
    12 * data.expenses.reduce((acc, { amount }) => acc + amount, 0);

  return (
    preTaxIncome -
    fedTax -
    stateTax -
    cityTax -
    socialSecurity -
    medicare -
    fourOhOneKTraditional -
    hsa -
    expenses
  );
}

function calculateTaxesOBJECT(data: Form) {
  // Use separate function, feels wasteful to create objects inside secant method
  const fedRate = FED_TAX.rates;
  const state = cityToState[data.city];
  const stateRate = STATE_TAX[state];
  const cityRate = CITY_TAX[data.city];

  const preTaxIncome = data.salary;
  const deductions = FED_TAX.standardDeduction;
  const socialSecurity = preTaxIncome * FED_TAX.socialSecurity;
  const medicare = preTaxIncome * FED_TAX.medicare;

  // Assume all trad
  const fourOhOneK = data.salary * data.fourOhOneK;
  const hsa = data.hsaContribution;

  const taxableIncome = preTaxIncome - deductions - fourOhOneK - hsa;

  const fedTax = calculateTax(taxableIncome, fedRate, data.status);
  const stateTax = calculateTax(taxableIncome, stateRate, data.status);
  const cityTax = calculateTax(taxableIncome, cityRate, data.status);

  const expenses =
    12 * data.expenses.reduce((acc, { amount }) => acc + amount, 0);

  return {
    preTaxIncome,
    fedTax,
    stateTax,
    cityTax,
    socialSecurity,
    medicare,
    fourOhOneK,
    hsa,
    expenses,
  };
}

function calculateTax(income: number, tax: Tax, status: TaxStatus): number {
  switch (tax.type) {
    case "status-based":
      return calculateTax(income, tax.status[status], status);
    case "bracket":
      let taxAmount = 0;
      for (const [bracket, rate] of Object.entries(tax.brackets)) {
        const bracketAmount = Math.min(income, Number(bracket));
        taxAmount += bracketAmount * rate;
        income -= bracketAmount;
      }
      return taxAmount;
    case "percentage":
      return income * tax.rate;
    case "flat":
      return income - tax.rate;
  }
}

export default App;

type FIELDProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  formKey: Path<T>;
  label?: ReactNode;
  placeholder?: string;
  format?: boolean;
};
function FIELD<T extends FieldValues>({
  form,
  formKey,
  label,
  placeholder,
  format = false,
}: FIELDProps<T>) {
  return (
    <FormField
      control={form.control}
      name={formKey}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Input
              {...field}
              placeholder={placeholder}
              value={format ? formatMoney(Number(field.value)) : field.value}
              onChange={(e) =>
                format && field.onChange(e.target.value.replace(/[^0-9.]/g, ""))
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

type StateAbbreviation = z.infer<typeof stateSchema>;

type TaxStatus = z.infer<typeof taxStatusSchema>;
type Bracket = Record<number, number>;

type StatusBased<T> = Record<TaxStatus, T>;

type Tax =
  | {
      type: "status-based";
      status: StatusBased<Tax>;
    }
  | {
      type: "bracket";
      brackets: Bracket;
    }
  | {
      type: "percentage";
      rate: number;
    }
  | {
      type: "flat";
      rate: number;
    };

type RangeBased = {
  low: number;
  high: number;
};

type FedTax = {
  standardDeduction: number;
  socialSecurity: number;
  medicare: number;
  hsaMaxContribution: StatusBased<number>;
  rothIRAMaxContribution: {
    range: StatusBased<RangeBased>;
    limit: number;
    limit50: number;
  };
  rates: Tax;
};

// 2024
const FED_TAX: FedTax = {
  standardDeduction: 12_550,
  socialSecurity: 0.062,
  medicare: 0.0145,
  hsaMaxContribution: {
    single: 4_150,
    married: 8_300,
    headOfHousehold: 8_300,
  },
  rothIRAMaxContribution: {
    range: {
      single: { low: 146_000, high: 161_000 },
      married: { low: 230_000, high: 240_000 },
      headOfHousehold: { low: 146_000, high: 161_000 },
    },
    limit: 7_000,
    limit50: 8_000,
  },
  rates: {
    type: "status-based",
    status: {
      single: {
        type: "bracket",
        brackets: {
          11_600: 0.1,
          47_150: 0.12,
          100_525: 0.22,
          191_950: 0.24,
          243_725: 0.32,
          609_350: 0.35,
          Infinity: 0.37,
        },
      },
      married: {
        type: "bracket",
        brackets: {
          23_200: 0.1,
          94_300: 0.12,
          201_050: 0.22,
          383_900: 0.24,
          487_450: 0.32,
          731_200: 0.35,
          Infinity: 0.37,
        },
      },
      headOfHousehold: {
        type: "bracket",
        brackets: {
          16_550: 0.1,
          63_100: 0.12,
          100_500: 0.22,
          191_950: 0.24,
          243_700: 0.32,
          609_350: 0.35,
          Infinity: 0.37,
        },
      },
    },
  },
};

type StateTax = Record<StateAbbreviation, Tax>;

// 2024
const STATE_TAX: StateTax = {
  PA: { type: "percentage", rate: 0.0307 },
  CA: {
    type: "status-based",
    status: {
      single: {
        type: "bracket",
        brackets: {
          10_756: 0.01,
          25_499: 0.02,
          40_245: 0.04,
          55_866: 0.06,
          70_606: 0.08,
          360_659: 0.093,
          432_787: 0.103,
          721_314: 0.113,
          Infinity: 0.123,
        },
      },
      married: {
        type: "bracket",
        brackets: {
          21_512: 0.01,
          50_998: 0.02,
          80_490: 0.04,
          111_732: 0.06,
          141_212: 0.08,
          721_318: 0.093,
          865_574: 0.103,
          1_442_628: 0.113,
          Infinity: 0.123,
        },
      },
      headOfHousehold: {
        type: "bracket",
        brackets: {
          21_527: 0.01,
          51_000: 0.02,
          65_744: 0.04,
          81_364: 0.06,
          96_107: 0.08,
          490_493: 0.093,
          588_593: 0.103,
          980_987: 0.113,
          Infinity: 0.123,
        },
      },
    },
  },
};

type CityTax = Record<City, Tax>;
const CITY_TAX: CityTax = {
  "Los Angeles": { type: "percentage", rate: 0 },
  "San Francisco": { type: "percentage", rate: 0 },
  Philadelphia: { type: "percentage", rate: 0.0375 },
  Pittsburgh: { type: "percentage", rate: 0.03 },
};

type City = z.infer<typeof citySchema>;

const cityToState: Record<City, StateAbbreviation> = {
  "San Francisco": "CA",
  "Los Angeles": "CA",
  Philadelphia: "PA",
  Pittsburgh: "PA",
};

type CityCombo = {
  name: City;
  stateAbbr: StateAbbreviation;
};
const CITIES: CityCombo[] = [
  { name: "San Francisco", stateAbbr: "CA" },
  { name: "Los Angeles", stateAbbr: "CA" },
  { name: "Philadelphia", stateAbbr: "PA" },
  { name: "Pittsburgh", stateAbbr: "PA" },
];

const COST_OF_LIVING: Record<City, CostOfLiving> = {
  "Los Angeles": {
    Housing: 233.3,
    Transportation: 142.6,
    Grocery: 111.6,
    Utilities: 113.9,
    Healthcare: 99.3,
    Miscellaneous: 117.6,
  },
  "San Francisco": {
    Housing: 274.9,
    Transportation: 147.1,
    Grocery: 122.8,
    Utilities: 161.2,
    Healthcare: 123.9,
    Miscellaneous: 117.5,
  },
  Philadelphia: {
    Housing: 97.4,
    Transportation: 108.7,
    Grocery: 103.5,
    Utilities: 104.4,
    Healthcare: 89.4,
    Miscellaneous: 102.9,
  },
  Pittsburgh: {
    Housing: 94.9,
    Transportation: 110,
    Grocery: 97.4,
    Utilities: 118.9,
    Healthcare: 99.5,
    Miscellaneous: 92.2,
  },
};
