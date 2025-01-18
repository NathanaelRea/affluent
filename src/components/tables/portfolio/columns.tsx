import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputWithFormat } from "@/components/InputRHF";

export const fundSchema = z.object({
  name: z.string(),
  mean: z.coerce.number().min(0).max(1, "Maximum of 100%"),
  std: z.coerce.number().min(0).max(1, "Maximum of 100%"),
  weight: z.coerce.number().min(0).max(1, "Maximum of 100%"),
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
    cell: ({ row, table }) => {
      const meta = table.options.meta;
      return (
        <InputWithFormat
          value={row.original.mean}
          onChange={(e) => {
            meta?.setValue?.(`portfolio.${row.index}.mean`, e.toString());
          }}
          onBlur={() => {}}
          type="percentage"
        />
      );
    },
  },
  {
    accessorKey: "std",
    header: "Std. Dev",
    cell: ({ row, table }) => {
      const meta = table.options.meta;
      return (
        <InputWithFormat
          value={row.original.std}
          onChange={(e) => {
            meta?.setValue?.(`portfolio.${row.index}.std`, e.toString());
          }}
          onBlur={() => {}}
          type="percentage"
        />
      );
    },
  },
  {
    accessorKey: "weight",
    header: "Allocation",
    cell: ({ row, table }) => {
      const meta = table.options.meta;
      return (
        <InputWithFormat
          value={row.original.weight}
          onChange={(e) => {
            meta?.setValue?.(`portfolio.${row.index}.weight`, e.toString());
          }}
          onBlur={() => {}}
          type="percentage"
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
