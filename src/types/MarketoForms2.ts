import type { FormValues } from "./FormData";

export type MktoSuccessHandler = (
  values: FormValues,
  followUpUrl: string,
) => boolean | void;

export type MktoValidateHandler = (isValid: boolean) => void;

export type MktoSubmitHandler = (form: MktoForm) => void;

export interface MktoForm {
  addHiddenFields(values: FormValues): void;
  getId(): number;
  onSubmit(handler: MktoSubmitHandler): void;
  onSuccess(handler: MktoSuccessHandler): void;
  onValidate(handler: MktoValidateHandler): void;
  setValues(values: FormValues): void;
  submit(): void;
  submittable(canSubmit: boolean): void;
  vals(): FormValues;
}

export interface MktoForms2Global {
  loadForm(
    baseUrl: string,
    munchkinId: string,
    formId: number,
    onReady: (form: MktoForm) => void,
  ): void;
}

declare global {
  interface Window {
    MktoForms2?: MktoForms2Global;
  }
}

export {};
