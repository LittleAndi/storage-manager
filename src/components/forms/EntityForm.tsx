import React from "react";
import { FormProvider, type UseFormReturn, type FieldValues } from "react-hook-form";

interface EntityFormProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: (data: T) => void | Promise<void>;
  className?: string;
  children: React.ReactNode;
}

export function EntityForm<T extends FieldValues>({ form, onSubmit, className, children }: EntityFormProps<T>) {
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={className ?? "space-y-4"}>
        {children}
      </form>
    </FormProvider>
  );
}
