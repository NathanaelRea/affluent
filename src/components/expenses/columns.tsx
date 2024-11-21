import { formatMoney } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

const expensesSchema = z.object({
  name: z.string(),
  value: z.number(),
});
export type Expenses = z.infer<typeof expensesSchema>;

export const expenseColumns: ColumnDef<Expenses>[] = [
  {
    accessorKey: "name",
    header: "Item",
  },
  {
    accessorKey: "value",
    header: "Amount ",
    cell: ({ row }) => formatMoney(row.original.value),
  },
];
