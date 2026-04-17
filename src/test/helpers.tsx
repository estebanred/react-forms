import { render, type RenderResult } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { useLayoutEffect } from "react";
import FormFields from "../components/FormFields";
import type { FormField } from "../types/FormData";
import type { FormApi } from "../types/types";

type RenderFieldOptions = {
  defaultValue?: string;
};

export type RenderFieldResult = RenderResult & {
  form: FormApi;
};

export function renderField(
  field: FormField,
  options: RenderFieldOptions = {},
): RenderFieldResult {
  let formApi: FormApi | undefined;

  function Harness({ onFormReady }: { onFormReady: (form: FormApi) => void }) {
    const form = useForm({
      defaultValues: {
        [field.name]: options.defaultValue ?? "",
      },
      onSubmit: async () => undefined,
    }) as FormApi;

    useLayoutEffect(() => {
      onFormReady(form);
    }, [form, onFormReady]);

    return <FormFields form={form} fields={[field]} />;
  }

  const rendered = render(
    <Harness
      onFormReady={(form) => {
        formApi = form;
      }}
    />,
  );
  if (!formApi) {
    throw new Error("Failed to initialize test form.");
  }

  return { ...rendered, form: formApi };
}
