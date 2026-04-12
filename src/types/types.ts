import type {
  FormAsyncValidateOrFn,
  FormValidateOrFn,
  ReactFormExtendedApi,
} from "@tanstack/react-form";
import type { FormValues } from "./FormData";

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
