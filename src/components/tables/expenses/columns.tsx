import { ReactNode } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { CATEGORIES, Category, categoryScheama } from "@/data";
import { InputWithFormat } from "@/components/InputRHF";
import { ShoppingBasket, Car, House, Minus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectItem,
} from "@/components/ui/select";

const categoryIcons: Record<Category, ReactNode> = {
  Housing: <House className="h-4" />,
  Transportation: <Car className="h-4" />,
  Miscellaneous: <ShoppingBasket className="h-4" />,
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
];
