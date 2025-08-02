import React, { ReactNode, useState } from "react";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { moneyFormatter, percentFormatter } from "@/lib/utils";

type FormatType = "money" | "percentage";

type InputRHFProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  formKey: Path<T>;
  label?: ReactNode;
  placeholder?: string;
  type?: FormatType | "number";
};
export function InputRHF<T extends FieldValues>({
  form,
  formKey,
  label,
  placeholder,
  type,
}: InputRHFProps<T>) {
  return (
    <FormField
      control={form.control}
      name={formKey}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            {type == "number" ? (
              <Input
                type="number"
                {...field}
                onChange={(e) =>
                  field.onChange(parseIntDefault(e.target.value))
                }
              />
            ) : type ? (
              <InputWithFormat
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                type={type}
                placeholder={placeholder}
              />
            ) : (
              <Input type="text" {...field} />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function parseIntDefault(value: string | undefined) {
  if (value == undefined || value === "") {
    return undefined;
  }
  const maybeNaN = parseInt(value);
  return isNaN(maybeNaN) ? undefined : maybeNaN;
}

function formatValue(value: number, type: FormatType): string {
  if (isNaN(value)) return "";
  switch (type) {
    case "money":
      return moneyFormatter.format(value);
    case "percentage":
      return percentFormatter.format(value);
  }
}

function parseValue(input: string, type: FormatType): number | undefined {
  const parsed = parseRaw(input);
  switch (type) {
    case "money":
      return parsed;
    case "percentage":
      return parsed ? parsed / 100 : undefined;
  }
}

function parseRaw(input: string) {
  const parsed = parseFloat(input.replace(/[^0-9.-]/g, ""));
  return isNaN(parsed) ? undefined : parsed;
}

type InputWithFormatProps = {
  value: number;
  onChange: (_: number | undefined) => void;
  onBlur: () => void;
  type: FormatType;
  placeholder?: string;
};

function valueAsString(value: number, type: FormatType) {
  if (type == "percentage") {
    return (value * 100).toFixed(2);
  }
  return value.toFixed();
}

export function InputWithFormat({
  value,
  onChange,
  onBlur,
  type,
  placeholder,
}: InputWithFormatProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(valueAsString(value, type));

  const handleFocus = () => {
    setIsEditing(true);
    setInputValue(valueAsString(value, type));
  };

  const handleBlur = () => {
    setIsEditing(false);
    const numericValue = parseValue(inputValue, type);
    onChange(numericValue);
    onBlur();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const numericValue = parseValue(inputValue, type);
      onChange(numericValue);
    }
  };

  return (
    <Input
      type={isEditing ? "number" : "text"}
      value={isEditing ? inputValue : formatValue(value, type)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
    />
  );
}
