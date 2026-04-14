export type FormValues = Record<string, string>;

type BaseField = {
  name: string;
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
  // Form-specific field types
  | (OptionsField & { type: "Select" })
  | (OptionsField & { type: "Checkbox" })
  | (OptionsField & { type: "Radio" })
  | (BaseField & { type: "SingleCheckbox" })
  | (BaseField & { type: "Range"; min?: number; max?: number })
  | (BaseField & { type: "HtmlText" })
  | (BaseField & { type: "Hidden" });
