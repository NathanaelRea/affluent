import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { BasicActions } from "../basic-table";
import { categories, categoryScheama } from "@/data";
import { Combobox } from "@/components/combobox";
import { Input } from "@/components/ui/input";
import { InputWithFormat } from "@/components/InputRHF";
import { TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    cell: ({ row, table }) => {
      const delFn = table.options.meta?.deleteRow;
      return (
        <Button
          size="sm"
          variant="ghost"
          type="button"
          disabled={delFn === undefined}
          onClick={() => delFn?.(row.index)}
          className="cursor-pointer text-destructive"
        >
          <TrashIcon className="h-4" />
        </Button>
      );
    },
  },
];
