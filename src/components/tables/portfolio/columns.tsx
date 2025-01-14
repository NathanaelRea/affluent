import { percentFormatter } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const fundSchema = z.object({
  name: z.string(),
  mean: z.number().min(0).max(1, "Maximum of 100%"),
  std: z.number().min(0).max(1, "Maximum of 100%"),
  weight: z.number().min(0).max(1, "Maximum of 100%"),
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
    cell: ({ row }) => percentFormatter.format(row.original.mean),
  },
  {
    accessorKey: "std",
    header: "Std. Dev",
    cell: ({ row }) => percentFormatter.format(row.original.std),
  },
  {
    accessorKey: "weight",
    header: "Allocation",
    cell: ({ row }) => percentFormatter.format(row.original.weight),
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
