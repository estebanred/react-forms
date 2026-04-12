export type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
};

export type FormFieldName = keyof FormValues;

type BaseField = {
  name: FormFieldName;
  label: string;
  placeholder?: string;
  required?: boolean;
};

type OptionsField = BaseField & {
  options: Array<{ label: string; value: string }>;
};

// Lead database field types
export type FormField =
  | (BaseField & { type: "Text" })
  | (BaseField & { type: "TextArea" })
  | (BaseField & { type: "Email" })
  | (BaseField & { type: "Phone" })
  | (BaseField & { type: "URL" })
  | (BaseField & { type: "Integer" })
  | (BaseField & { type: "Float" })
  | (BaseField & { type: "Currency" })
  | (BaseField & { type: "Percent" })
  | (BaseField & { type: "Score" })
  | (BaseField & { type: "Date" })
  | (BaseField & { type: "DateTime" })
  | (BaseField & { type: "Boolean" })
  | (BaseField & { type: "Formula" })
  | (BaseField & { type: "Reference" })
  // Form-specific field types
  | (OptionsField & { type: "Select" })
  | (OptionsField & { type: "Checkbox" })
  | (OptionsField & { type: "Radio" })
  | (BaseField & { type: "SingleCheckbox" })
  | (BaseField & { type: "Range"; min?: number; max?: number })
  | (BaseField & { type: "HtmlText" })
  | (BaseField & { type: "Hidden" });

export const formFields = [
  {
    type: "Text",
    name: "firstName",
    label: "First name",
    placeholder: "First name",
    required: true,
  },
  {
    type: "Text",
    name: "lastName",
    label: "Last name",
    placeholder: "Last name",
    required: true,
  },
  {
    type: "Email",
    name: "email",
    label: "Email",
    placeholder: "test@test.com",
  },
  {
    type: "TextArea",
    name: "message",
    label: "Message",
    placeholder: "Tell us what you want to build with TanStack Form.",
  },
] satisfies FormField[];
