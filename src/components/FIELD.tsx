import { ReactNode } from "react";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";

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
export function FIELD<T extends FieldValues>({
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
                format
                  ? field.onChange(format.formatInput(e.target.value))
                  : field.onChange(e.target.value)
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
