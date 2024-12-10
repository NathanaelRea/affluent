import { formatMoney } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

import { BasicActions } from "../basic-table";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    header: "Amount",
    cell: ({ row }) => formatMoney(row.original.value),
  },
  {
    id: "actions",
    cell: ({ row, table }) => (
      <BasicActions meta={table.options.meta} index={row.index} />
    ),
  },
];
