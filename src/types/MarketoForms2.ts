import type { FormValues } from "./FormData";

export type MktoSuccessHandler = (
  values: FormValues,
  followUpUrl: string,
) => boolean | void;

export interface MktoForm {
  onSuccess(handler: MktoSuccessHandler): void;
  setValues(values: FormValues): void;
  submit(): void;
  submittable(canSubmit: boolean): void;
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
