import { ReactNode } from "react";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "./ui/form";
import { Combobox } from "./combobox";
import { Item } from "./combobox.tsx";

type ComboboxRHFProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  formKey: Path<T>;
  items: Item[];
  label?: ReactNode;
};
export function ComboboxRHF<T extends FieldValues>({
  form,
  formKey,
  label,
  items,
}: ComboboxRHFProps<T>) {
  return (
    <FormField
      control={form.control}
      name={formKey}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <div>
              <Combobox {...field} setValue={field.onChange} items={items} />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
