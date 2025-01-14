import { ReactElement, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "../components/ui/form";
import { Button } from "../components/ui/button";
import { Fund, fundSchema } from "../components/tables/portfolio/columns";
import { InputRHF } from "../components/InputRHF";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "../components/ui/dialog.tsx";
import { DialogHeader } from "../components/ui/dialog";

export default function FundDialog({
  children,
  defaultValues,
  handleSubmit,
}: {
  children: ReactElement;
  defaultValues?: Fund;
  handleSubmit: (_: Fund) => void;
}) {
  const [open, setOpen] = useState(false);
  const type = defaultValues ? "Edit" : "Add";
  const toggleOpen = () => setOpen((b) => !b);
  return (
    <Dialog open={open} onOpenChange={toggleOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{type} fund</DialogTitle>
        </DialogHeader>
        <FundUpdateForm
          handleSubmit={(data) => {
            handleSubmit(data);
            toggleOpen();
          }}
          defaultValues={defaultValues}
        />
      </DialogContent>
    </Dialog>
  );
}

function FundUpdateForm({
  defaultValues,
  handleSubmit,
}: {
  defaultValues?: Fund;
  handleSubmit: (_: Fund) => void;
}) {
  const form = useForm<Fund>({
    resolver: zodResolver(fundSchema),
    defaultValues: {
      mean: 0.05,
      std: 0.05,
      weight: 0.2,
      ...defaultValues,
    },
  });

  const onSubmit = (data: Fund) => {
    handleSubmit(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.stopPropagation();
          form.handleSubmit(onSubmit)(e);
          return;
        }}
        className="space-y-8"
      >
        <InputRHF form={form} formKey="name" label="Name" />
        <InputRHF
          form={form}
          formKey="mean"
          label="Mean Return"
          type="percentage"
        />
        <InputRHF
          form={form}
          formKey="std"
          label="Standard Deviation"
          type="percentage"
        />
        <InputRHF
          form={form}
          formKey="weight"
          label="Allocation percent"
          type="percentage"
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
