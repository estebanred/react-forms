import type {
  FormAsyncValidateOrFn,
  FormValidateOrFn,
  ReactFormExtendedApi,
} from "@tanstack/react-form";
import type { ContactFormData } from "../utils/validation";

export type ContactFormApi = ReactFormExtendedApi<
  ContactFormData,
  undefined | FormValidateOrFn<ContactFormData>,
  undefined | FormValidateOrFn<ContactFormData>,
  undefined | FormAsyncValidateOrFn<ContactFormData>,
  undefined | FormValidateOrFn<ContactFormData>,
  undefined | FormAsyncValidateOrFn<ContactFormData>,
  undefined | FormValidateOrFn<ContactFormData>,
  undefined | FormAsyncValidateOrFn<ContactFormData>,
  undefined | FormValidateOrFn<ContactFormData>,
  undefined | FormAsyncValidateOrFn<ContactFormData>,
  undefined | FormAsyncValidateOrFn<ContactFormData>,
  unknown
>;
