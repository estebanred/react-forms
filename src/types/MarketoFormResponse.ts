export type MarketoDatatype =
  | "string"
  | "email"
  | "phone"
  | "picklist"
  | "radio"
  | "boolean"
  | "htmltext"
  | "checkbox"
  | "hidden"
  | "textarea"
  | "url"
  | "integer"
  | "float"
  | "currency"
  | "percent"
  | "score"
  | "date"
  | "datetime";

export type MarketoInputSourceChannel = "constant" | "url" | "cookie" | string;

export type MarketoPicklistValue = {
  label: string;
  value: string;
  selected?: boolean;
  isDefault?: boolean;
};

export type MarketoVisibilityRuleItem = {
  subjectField: string;
  fieldLabel?: string;
  operator: string;
  values?: string[];
  altLabel?: string | null;
  picklistFilterValues?: MarketoPicklistValue[];
};

export type MarketoVisibilityRule = {
  defaultVisibility?: "hide" | "show";
  rules?: MarketoVisibilityRuleItem[];
};

export type MarketoRowField = {
  Id: number;
  Name: string;
  Datatype: MarketoDatatype;
  IsRequired?: boolean;
  Description?: string;
  Maxlength?: number;
  InputLabel?: string;
  InputInitialValue?: string;
  PlaceholderText?: string;
  InputSourceChannel?: MarketoInputSourceChannel;
  InputSourceSelector?: string;
  FieldWidth?: number;
  LabelWidth?: number;
  VisibleRows?: number;
  ProfilingFieldNumber?: number;
  ValidationMessage?: string;
  PicklistValues?: MarketoPicklistValue[];
  DefaultValue?: string[];
  DisablePrefill?: boolean;
  VisibilityRule?: MarketoVisibilityRule;
  Htmltext?: string;
  IsLabelToLeft?: boolean;
};

export type MarketoField = MarketoRowField;

export type MarketoFormRows = MarketoRowField[][];

export type MarketoFormResponse = {
  rows: MarketoFormRows;
};
