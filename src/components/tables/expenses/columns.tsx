import { ReactNode } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { CATEGORIES, Category, categoryScheama } from "@/data";
import { Input } from "@/components/ui/input";
import { InputWithFormat } from "@/components/InputRHF";
import {
  Ambulance,
  Box,
  Car,
  House,
  Minus,
  ShoppingBasket,
  Trash2Icon,
  UtilityPole,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectItem,
} from "../../ui/select.tsx";

const categoryIcons: Record<Category, ReactNode> = {
  Healthcare: <Ambulance className="h-4" />,
  Housing: <House className="h-4" />,
  Transportation: <Car className="h-4" />,
  Grocery: <ShoppingBasket className="h-4" />,
  Utilities: <UtilityPole className="h-4" />,
  Miscellaneous: <Box className="h-4" />,
  Fixed: <Minus className="h-4" />,
};

export const expenseSchema = z.object({
  name: z.string(),
  category: categoryScheama,
  amount: z.coerce.number(),
});
export type Expense = z.infer<typeof expenseSchema>;

export const expenseColumns: ColumnDef<Expense>[] = [
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
        <Select
          value={row.original.category}
          onValueChange={(v) => {
            meta?.setValue?.(`expenses.${row.index}.category`, v);
          }}
        >
          <SelectTrigger className="text-xs md:text-base">
            <div>
              <span className="md:hidden">
                {categoryIcons[row.original.category]}
              </span>
              <span className="hidden md:inline">{row.original.category}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem value={c} key={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          size={"sm"}
          title="Delete row"
          variant="ghost"
          type="button"
          disabled={delFn === undefined}
          onClick={() => delFn?.(row.index)}
          className="cursor-pointer text-destructive p-1"
        >
          <Trash2Icon className="h-2" />
        </Button>
      );
    },
  },
];
