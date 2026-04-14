import { getFieldValidator } from "../../utils/validators";
import type { FormField } from "../../types/FormData";
import type { FormApi } from "../../types/types";

type HtmlTextProps = {
  form: FormApi;
  label: string;
  name: FormField["name"];
  placeholder?: string;
  type: Extract<FormField, { type: "HtmlText" }>["type"];
};

function HtmlText({ form, label, name, placeholder, type }: HtmlTextProps) {
  return (
    <form.Field name={name} validators={getFieldValidator({ type, required: false })}>
      {() => (
        <div
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80"
          dangerouslySetInnerHTML={{ __html: placeholder ?? label }}
        />
      )}
    </form.Field>
  );
}

export default HtmlText;
