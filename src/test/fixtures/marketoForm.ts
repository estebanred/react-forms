import type {
  MarketoField,
  MarketoFormResponse,
} from "../../types/MarketoFormResponse";

const baseHiddenField: MarketoField = {
  Id: 9000,
  Name: "HiddenFixture",
  Datatype: "hidden",
  InputLabel: "",
  InputInitialValue: "hidden-default",
  InputSourceChannel: "constant",
  InputSourceSelector: "fixture-source",
};

export function makeHiddenField(
  overrides: Partial<MarketoField> = {},
): MarketoField {
  return {
    ...baseHiddenField,
    ...overrides,
    Datatype: "hidden",
  };
}

export const hiddenFieldVariants = {
  constant: makeHiddenField({
    Id: 19,
    Name: "HiddenConstant",
    InputInitialValue: "constant-default",
    InputSourceChannel: "constant",
    InputSourceSelector: "constant_source",
  }),
  cookie: makeHiddenField({
    Id: 20,
    Name: "HiddenCookie",
    InputInitialValue: "cookie-default",
    InputSourceChannel: "cookie",
    InputSourceSelector: "utm_cookie",
  }),
  url: makeHiddenField({
    Id: 21,
    Name: "HiddenUrl",
    InputInitialValue: "url-default",
    InputSourceChannel: "url",
    InputSourceSelector: "utm_source",
  }),
};

const datatypeFields: MarketoField[] = [
  {
    Id: 1,
    Name: "TextField",
    Datatype: "string",
    InputLabel: "Text",
    IsRequired: true,
    PlaceholderText: "Enter text",
  },
  {
    Id: 2,
    Name: "EmailField",
    Datatype: "email",
    InputLabel: "Email",
    IsRequired: true,
  },
  {
    Id: 3,
    Name: "PhoneField",
    Datatype: "phone",
    InputLabel: "Phone",
  },
  {
    Id: 4,
    Name: "PicklistField",
    Datatype: "picklist",
    InputLabel: "Picklist",
    PicklistValues: [
      { label: "Select…", value: "" },
      { label: "One", value: "one" },
      { label: "Two", value: "two" },
    ],
  },
  {
    Id: 5,
    Name: "RadioField",
    Datatype: "radio",
    InputLabel: "Radio",
    PicklistValues: [
      { label: "Alpha", value: "a" },
      { label: "Beta", value: "b" },
    ],
  },
  {
    Id: 6,
    Name: "BooleanField",
    Datatype: "boolean",
    InputLabel: "Boolean",
  },
  {
    Id: 7,
    Name: "HtmlTextField",
    Datatype: "htmltext",
    InputLabel: "",
    Htmltext: "<strong>Terms</strong>",
  },
  {
    Id: 8,
    Name: "CheckboxField",
    Datatype: "checkbox",
    InputLabel: "Checkbox",
    PicklistValues: [
      { label: "Red", value: "red" },
      { label: "Blue", value: "blue" },
    ],
  },
  makeHiddenField({
    Id: 9,
    Name: "HiddenField",
    InputInitialValue: "hidden-value",
    InputSourceChannel: "constant",
    InputSourceSelector: "hidden_selector",
  }),
  {
    Id: 10,
    Name: "TextAreaField",
    Datatype: "textarea",
    InputLabel: "Message",
    VisibleRows: 4,
  },
  {
    Id: 11,
    Name: "UrlField",
    Datatype: "url",
    InputLabel: "Website",
  },
  {
    Id: 12,
    Name: "IntegerField",
    Datatype: "integer",
    InputLabel: "Integer",
  },
  {
    Id: 13,
    Name: "FloatField",
    Datatype: "float",
    InputLabel: "Float",
  },
  {
    Id: 14,
    Name: "CurrencyField",
    Datatype: "currency",
    InputLabel: "Currency",
  },
  {
    Id: 15,
    Name: "PercentField",
    Datatype: "percent",
    InputLabel: "Percent",
  },
  {
    Id: 16,
    Name: "ScoreField",
    Datatype: "score",
    InputLabel: "Score",
  },
  {
    Id: 17,
    Name: "DateField",
    Datatype: "date",
    InputLabel: "Date",
  },
  {
    Id: 18,
    Name: "DateTimeField",
    Datatype: "datetime",
    InputLabel: "Date Time",
  },
];

export const marketoFormFixture: MarketoFormResponse = {
  rows: [
    ...datatypeFields.map((field) => [field]),
    [hiddenFieldVariants.constant],
    [hiddenFieldVariants.cookie],
    [hiddenFieldVariants.url],
  ],
};
