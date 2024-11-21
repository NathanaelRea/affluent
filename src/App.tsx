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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { useState } from "react";
import { DataTable } from "./components/expenses/data-table";
import { expenseColumns } from "./components/expenses/columns";
import { Label } from "./components/ui/label";
import { formatMoney, secantMethod } from "./lib/utils";

const COL_CATEGORIES = [
  "Housing",
  "Transportation",
  "Grocery",
  "Utilities",
  "Healthcare",
  "Entertainment",
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

const stateSchema = z.enum(["CA", "PA"]);
const citySchema = z.enum([
  "San Francisco",
  "Los Angeles",
  "Philadelphia",
  "Pittsburgh",
]);
const formSchema = z.object({
  city: citySchema,
  salary: z.coerce.number(),
  bonus: z.coerce.number(),
  fourOhOneK: z.coerce.number().min(0).max(1),
  hsa: z.coerce.number(),
  expenses: z.array(expenseSchema),
});
type Form = z.infer<typeof formSchema>;

function App() {
  const [data, setData] = useState<Form | null>(null);

  const defaultValues: Form = {
    city: "Philadelphia",
    salary: 100_000,
    bonus: 10_000,
    fourOhOneK: 0.05,
    hsa: 1_000,
    expenses: [
      { name: "Rent", amount: 1_000, type: "Housing" },
      { name: "Renter's Insurance", amount: 10, type: "Housing" },
      { name: "Food", amount: 300, type: "Grocery" },
      { name: "Utilities", amount: 100, type: "Utilities" },
      { name: "Car", amount: 500, type: "Transportation" },
      { name: "Entertainment", amount: 100, type: "Entertainment" },
      { name: "Misc", amount: 100, type: "Entertainment" },
    ],
  };
  const form = useForm<Form>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = (data: Form) => {
    setData(data);
    console.log(data);
  };

  return (
    <div className="flex flex-col justify-center items-center">
      <main className="flex flex-col max-w-3xl w-full">
        <h1 className="text-2xl">Finance thing</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CitySelect disabled value="Philadelphia" />
            <h2 className="text-xl">Income</h2>
            <FIELD form={form} formKey="salary" label="Salary" format />
            <FIELD form={form} formKey="bonus" label="Bonus" format />
            <FIELD form={form} formKey="fourOhOneK" label="401(k)" />
            <FIELD form={form} formKey="hsa" label="HSA" format />
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

function blackBox(formBase: Form, localNetTakeHomePay: number) {
  return (x: number) => {
    const form = {
      ...formBase,
      salary: x,
    };
    return calculateNetTakeHomePay(form) - localNetTakeHomePay;
  };
}

function Results({ data }: { data: Form }) {
  const convertedData = data && {
    ...data,
    bonus: 0,
    expenses: data.expenses.map((e) => ({
      ...e,
      amount: convertCostOfLiving(e.amount, data.city, "San Francisco", e.type),
    })),
  };

  const localNetTakeHomePay = calculateNetTakeHomePay(data);
  const remoteSalaryNeeded = secantMethod(
    blackBox(convertedData, localNetTakeHomePay),
    0,
    1_000_000
  );

  convertedData.salary = remoteSalaryNeeded;
  const remoteNetTakeHomePay = calculateNetTakeHomePay(convertedData);

  return (
    <div>
      <h2 className="text-xl">Results</h2>
      <CitySelect disabled value="San Francisco" />
      <Label>Income</Label>
      <Input value={formatMoney(convertedData.salary)} disabled />
      <Label>Bonus</Label>
      <Input value={formatMoney(convertedData.bonus)} disabled />
      <h2 className="text-xl">Expenses</h2>
      <DataTable
        columns={expenseColumns}
        data={convertedData.expenses.map((e) => ({
          name: e.name,
          value: e.amount,
        }))}
      />
      <Label>Local Net Take Home Pay (yr, mo)</Label>
      <Input value={formatMoney(localNetTakeHomePay)} disabled />
      <Input value={formatMoney(localNetTakeHomePay / 12)} disabled />
      <Label>Remote Net Take Home Pay (yr, mo)</Label>
      <Input value={formatMoney(remoteNetTakeHomePay)} disabled />
      <Input value={formatMoney(remoteNetTakeHomePay / 12)} disabled />
    </div>
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
              <Select value={data.type}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {COL_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

  const preTaxIncome = data.salary + data.bonus;
  const deductions = FED_TAX.standardDeduction;
  const socialSecurity = preTaxIncome * FED_TAX.socialSecurity;
  const medicare = preTaxIncome * FED_TAX.medicare;

  // Assume all trad
  const fourOhOneKTraditional = data.salary * data.fourOhOneK;
  const hsa = data.hsa;

  const taxableIncome = preTaxIncome - deductions - fourOhOneKTraditional - hsa;

  const fedTax = calculateTax(taxableIncome, fedRate);
  const stateTax = calculateTax(taxableIncome, stateRate);
  const cityTax = calculateTax(taxableIncome, cityRate);

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
function calculateTax(income: number, tax: Tax): number {
  switch (tax.type) {
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

function CitySelect({
  value,
  disabled = false,
}: {
  value: City;
  disabled?: boolean;
}) {
  return (
    <Select disabled={disabled} value={value}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="City" />
      </SelectTrigger>
      <SelectContent>
        {CITIES.map((city) => (
          <SelectItem key={city.name} value={city.name}>
            {city.name}, {city.stateAbbr}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default App;

type FIELDProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  formKey: Path<T>;
  label?: string;
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
type Tax =
  | {
      type: "bracket";
      brackets: Record<number, number>;
    }
  | {
      type: "percentage";
      rate: number;
    }
  | {
      type: "flat";
      rate: number;
    };

type FedTax = {
  standardDeduction: number;
  socialSecurity: number;
  medicare: number;
  rates: Tax;
};
const FED_TAX: FedTax = {
  standardDeduction: 12_550,
  socialSecurity: 0.062,
  medicare: 0.0145,
  rates: {
    type: "bracket",
    brackets: {
      // 0: 0,
      9_950: 0.1,
      40_525: 0.12,
      86_375: 0.22,
      164_925: 0.24,
      209_425: 0.32,
      523_600: 0.35,
      Infinity: 0.37,
    },
  },
};

type StateTax = Record<StateAbbreviation, Tax>;
const STATE_TAX: StateTax = {
  PA: { type: "percentage", rate: 0.05 },
  CA: {
    type: "bracket",
    brackets: {
      // 0: 0.01,
      20_255: 0.04,
      44_377: 0.08,
      286_492: 0.103,
      572_980: 0.123,
      1_000_000: 0.133,
    },
  },
};

type CityTax = Record<City, Tax>;
const CITY_TAX: CityTax = {
  "Los Angeles": { type: "percentage", rate: 0 },
  "San Francisco": { type: "percentage", rate: 0 },
  Philadelphia: { type: "percentage", rate: 0.03 },
  Pittsburgh: { type: "percentage", rate: 0.02 },
};

type City = z.infer<typeof citySchema>;

type State = {
  name: string;
  abbr: StateAbbreviation;
  cities: City[];
};
const STATES: Record<StateAbbreviation, State> = {
  CA: {
    name: "California",
    abbr: "CA",
    cities: ["San Francisco", "Los Angeles"],
  },
  PA: {
    name: "Pennsylvania",
    abbr: "PA",
    cities: ["Philadelphia", "Pittsburgh"],
  },
};

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
    Housing: 1.2,
    Transportation: 1.1,
    Grocery: 1.1,
    Utilities: 1.05,
    Healthcare: 1.1,
    Entertainment: 1.15,
  },
  "San Francisco": {
    Housing: 1.5,
    Transportation: 1.2,
    Grocery: 1.2,
    Utilities: 1.1,
    Healthcare: 1.15,
    Entertainment: 1.2,
  },
  Philadelphia: {
    Housing: 0.9,
    Transportation: 0.95,
    Grocery: 0.95,
    Utilities: 0.9,
    Healthcare: 0.95,
    Entertainment: 0.9,
  },
  Pittsburgh: {
    Housing: 0.85,
    Transportation: 0.9,
    Grocery: 0.9,
    Utilities: 0.85,
    Healthcare: 0.9,
    Entertainment: 0.85,
  },
};
