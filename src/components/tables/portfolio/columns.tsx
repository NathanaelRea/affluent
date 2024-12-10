import { formatPercent } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { BasicActions } from "../basic-table";

export const fundSchema = z.object({
  name: z.string(),
  mean: z.number(),
  std: z.number(),
  weight: z.number(),
});
export type Fund = z.infer<typeof fundSchema>;

export const fundColumns: ColumnDef<Fund>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "mean",
    header: "Mean",
    cell: ({ row }) => formatPercent(row.original.mean),
  },
  {
    accessorKey: "std",
    header: "Std. Dev",
    cell: ({ row }) => formatPercent(row.original.std),
  },
  {
    accessorKey: "weight",
    header: "Allocation",
    cell: ({ row }) => formatPercent(row.original.weight),
  },
  {
    id: "actions",
    cell: ({ row, table }) => (
      <BasicActions meta={table.options.meta} index={row.index} />
    ),
  },
];
