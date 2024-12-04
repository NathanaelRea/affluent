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
import { ReactNode, useEffect, useState } from "react";
import { Label } from "./components/ui/label";
import { formatMoney, formatPercent, secantMethod } from "./lib/utils";
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
import { toast } from "sonner";
import {
  categories,
  cities,
  cityMap,
  FED_TAX,
  stateMap,
  Tax,
  TAX_STATUS,
  TaxStatus,
  taxStatusSchema,
} from "./data";

const expenseSchema = z.object({
  name: z.string(),
  amount: z.coerce.number(),
  categoryId: z.string(),
});

const formSchema = z
  .object({
    cityId: z.string(),
    status: taxStatusSchema,
    age: z.coerce.number(),
    salary: z.coerce.number(),
    fourOhOneK: z.coerce.number().min(0).max(1),
    hsaContribution: z.coerce.number(),
    rothIRAContribution: z.coerce.number(),
    afterTaxInvestments: z.coerce.number(),
    expenses: z.array(expenseSchema),
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
  cityId: "3",
  status: "single",
  salary: 100_000,
  age: 30,
  fourOhOneK: 0.05,
  hsaContribution: 1_000,
  rothIRAContribution: 4_810,
  afterTaxInvestments: 0,
  expenses: [
    { name: "Rent", amount: 1_000, categoryId: "1" },
    { name: "Renter's Insurance", amount: 10, categoryId: "1" },
    { name: "Food", amount: 300, categoryId: "3" },
    { name: "Utilities", amount: 100, categoryId: "4" },
    { name: "Car", amount: 500, categoryId: "2" },
    { name: "Entertainment", amount: 100, categoryId: "6" },
    { name: "Misc", amount: 100, categoryId: "6" },
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

const moneyFormatter = {
  formatValue: formatMoney,
  formatInput: (value: string) => Number(value.replace(/[^0-9.]/g, "")),
};

const percentFormatter = {
  formatValue: formatPercent,
  formatInput: (value: string) => Number(value.replace(/[^0-9.]/g, "")) / 100,
};

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
    <div className="flex flex-col justify-center items-center">
      <main className="flex flex-col max-w-3xl w-full">
        <h1 className="text-2xl">Affluent</h1>
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
              items={cities.map((c) => ({
                label: `${c.name}, ${c.state.abbreviation}`,
                value: c.id,
              }))}
              value={"3"}
              setValue={() => {}}
            />
            <FIELD form={form} formKey="age" label="Age" />
            <h2 className="text-xl">Income</h2>
            <FIELD
              form={form}
              formKey="salary"
              label="Salary"
              format={moneyFormatter}
            />
            <FIELD
              form={form}
              formKey="fourOhOneK"
              label="401(k)"
              format={percentFormatter}
            />
            <FIELD
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
              format={moneyFormatter}
            />
            <FIELD
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
              format={moneyFormatter}
            />
            <FIELD
              form={form}
              formKey="afterTaxInvestments"
              label="After tax investments"
              format={moneyFormatter}
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
  const [remoteCityId, setRemoteCityId] = useState<string>(data.cityId);
  const convertedData = convertCOLAndFindSalary(data, remoteCityId);

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

  const localNetTakeHomePay = calculateNetTakeHomePay(data).netTakeHome;
  const remoteNetTakeHomePay =
    calculateNetTakeHomePay(convertedData).netTakeHome;

  return (
    <div>
      <h2 className="text-xl">Results</h2>
      <div>
        <Combobox
          name="city"
          items={cities.map((c) => ({
            label: `${c.name}, ${c.state.abbreviation}`,
            value: c.id,
          }))}
          value={remoteCityId}
          setValue={(c) => setRemoteCityId(c)}
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

function convertCOLAndFindSalary(data: MyForm, remoteCityId: string): MyForm {
  const localAfterTax = data.rothIRAContribution + data.afterTaxInvestments;
  const dataNoAfterTax: MyForm = {
    ...data,
    rothIRAContribution: 0,
    afterTaxInvestments: 0,
  };
  const newData: MyForm = {
    ...dataNoAfterTax,
    cityId: remoteCityId,
    expenses: data.expenses.map((e) => ({
      ...e,
      amount: convertCostOfLiving(
        e.amount,
        data.cityId,
        remoteCityId,
        e.categoryId,
      ),
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

  const chartConfig = {
    local: {
      label: localData.cityId,
      color: "#2563eb",
    },
    remote: {
      label: remoteData.cityId,
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

  const chartConfig = {
    local: {
      label: localData.cityId,
      color: "#2563eb",
    },
    remote: {
      label: remoteData.cityId,
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
  localCityId: string,
  remoteCityId: string,
  categoryId: string,
): number {
  const localCOL = cityMap.get(localCityId)?.costOfLiving[categoryId];
  const remoteCOL = cityMap.get(remoteCityId)?.costOfLiving[categoryId];
  if (!localCOL || !remoteCOL) {
    throw new Error("Invalid city id");
    return value;
  }
  return value * (remoteCOL / localCOL);
}

function ExpensesTable({ form }: { form: UseFormReturn<MyForm> }) {
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
                items={categories.map((c) => {
                  return {
                    label: c.name,
                    value: c.id,
                  };
                })}
                value={data.categoryId}
                setValue={(v) => {
                  form.setValue(`expenses.${index}.categoryId`, v);
                }}
              />
            </TableCell>
            <TableCell>
              <FIELD
                form={form}
                formKey={`expenses.${index}.amount`}
                format={moneyFormatter}
              />
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
                .reduce((acc, { amount }) => acc + Number(amount), 0),
            )}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

function getCityAndState(cityId: string) {
  const city = cityMap.get(cityId);
  if (!city) {
    throw new Error("Invalid city id");
  }
  const state = stateMap.get(city.state.id);
  if (!state) {
    throw new Error("Invalid state id");
  }
  return {
    city: city,
    state: state,
  };
}

function calculateNetTakeHomePay(data: MyForm) {
  const fedRate = FED_TAX.rates;
  const { city, state } = getCityAndState(data.cityId);
  const cityRate = city.tax;
  const stateRate = state.tax;

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
  };
}

function calculateTax(income: number, tax: Tax, status: TaxStatus): number {
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
      return income - tax.rate;
    case "none":
      return 0;
  }
}

export default App;

type FIELDProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  formKey: Path<T>;
  label?: ReactNode;
  placeholder?: string;
  format?: {
    formatValue: (_: number) => string;
    formatInput: (_: string) => number;
  };
};
function FIELD<T extends FieldValues>({
  form,
  formKey,
  label,
  placeholder,
  format,
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
              value={
                format ? format.formatValue(Number(field.value)) : field.value
              }
              onChange={(e) =>
                format && field.onChange(format.formatInput(e.target.value))
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
