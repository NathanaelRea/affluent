import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { BasicActions } from "../basic-table";
import { categories, categoryScheama } from "@/data";
import { Combobox } from "@/components/combobox";
import { Input } from "@/components/ui/input";
import { InputWithFormat } from "@/components/InputRHF";

export const expensesSchema = z.object({
  name: z.string(),
  category: categoryScheama,
  amount: z.coerce.number(),
});
export type Expenses = z.infer<typeof expensesSchema>;

export const expenseColumns: ColumnDef<Expenses>[] = [
  {
    accessorKey: "name",
    header: "Item",
    cell: ({ row, table }) => {
      const meta = table.options.meta;
      return (
        <Input
          value={row.original.name}
          onChange={(e) => {
            meta?.setValue?.(`expenses.${row.index}.name`, e.target.value);
          }}
        />
      );
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row, table }) => {
      const meta = table.options.meta;
      return (
        <Combobox
          name="category"
          items={categories.map((c) => {
            return {
              label: c,
              value: c,
            };
          })}
          value={row.original.category}
          setValue={(v) => {
            meta?.setValue?.(`expenses.${row.index}.category`, v);
          }}
        />
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row, table }) => {
      const meta = table.options.meta;
      return (
        <InputWithFormat
          value={row.original.amount}
          onChange={(e) => {
            meta?.setValue?.(`expenses.${row.index}.amount`, e.toString());
          }}
          onBlur={() => {}}
          type="money"
        />
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => (
      <BasicActions meta={table.options.meta} index={row.index} />
    ),
  },
];
