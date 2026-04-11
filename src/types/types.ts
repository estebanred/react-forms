import type {
  FormAsyncValidateOrFn,
  FormValidateOrFn,
  ReactFormExtendedApi,
} from "@tanstack/react-form";

export type FormValues = {
  fullName: string;
  email: string;
  message: string;
};

export type FormFieldName = keyof FormValues;

export type FormField =
  | {
      type: "Text";
      name: FormFieldName;
      label: string;
      placeholder?: string;
    }
  | {
      type: "Email";
      name: FormFieldName;
      label: string;
      placeholder?: string;
    }
  | {
      type: "TextArea";
      name: FormFieldName;
      label: string;
      placeholder?: string;
    };

export type FormApi = ReactFormExtendedApi<
  FormValues,
  undefined | FormValidateOrFn<FormValues>,
  undefined | FormValidateOrFn<FormValues>,
  undefined | FormAsyncValidateOrFn<FormValues>,
  undefined | FormValidateOrFn<FormValues>,
  undefined | FormAsyncValidateOrFn<FormValues>,
  undefined | FormValidateOrFn<FormValues>,
  undefined | FormAsyncValidateOrFn<FormValues>,
  undefined | FormValidateOrFn<FormValues>,
  undefined | FormAsyncValidateOrFn<FormValues>,
  undefined | FormAsyncValidateOrFn<FormValues>,
  unknown
>;
