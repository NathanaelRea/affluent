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

type InputWithFormatRHFProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  formKey: Path<T>;
  label?: ReactNode;
  placeholder?: string;
  type: FormatType;
};
export function InputWithFormatRHF<T extends FieldValues>({
  form,
  formKey,
  label,
  placeholder,
  type,
}: InputWithFormatRHFProps<T>) {
  return (
    <FormField
      control={form.control}
      name={formKey}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <InputWithFormat
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              type={type}
              placeholder={placeholder}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
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

function parseValue(input: string, type: FormatType): number {
  switch (type) {
    case "money":
      return parseRaw(input);
    case "percentage":
      return parseRaw(input) / 100;
  }
}

function parseRaw(input: string) {
  const parsed = parseFloat(input.replace(/[^0-9.-]/g, ""));
  return isNaN(parsed) ? 0 : parsed;
}

type InputWithFormatProps = {
  value: number;
  onChange: (value: number) => void;
  onBlur: () => void;
  type: FormatType;
  placeholder?: string;
};

function valueAsString(value: number, type: FormatType) {
  if (type == "percentage") {
    return (value * 100).toString();
  }
  return value.toString();
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

  return (
    <Input
      type="text"
      value={isEditing ? inputValue : formatValue(value, type)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      placeholder={placeholder}
    />
  );
}
