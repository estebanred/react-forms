import { useCallback, useEffect, useRef, useState } from "react";
import { useMarketoFormsScript } from "./useMarketoFormsScript";
import type { FormValues } from "../types/FormData";
import type { MktoForm } from "../types/MarketoForms2";

type MarketoFormStatus = "idle" | "loading" | "ready" | "error";

type UseMarketoFormOptions = {
  marketoOrigin: string | undefined;
  munchkinId: string | undefined;
  formId: number;
  enabled: boolean;
};

type UseMarketoFormResult = {
  status: MarketoFormStatus;
  error: Error | null;
  submit: (values: FormValues) => Promise<void>;
};

type PendingSubmission = {
  reject: (error: Error) => void;
  resolve: () => void;
  timeoutId: number;
};

const SUBMIT_TIMEOUT_MS = 15_000;

function createMissingConfigError() {
  return new Error("Marketo form configuration is incomplete.");
}

function createMissingGlobalError() {
  return new Error("Marketo Forms 2.0 script loaded without MktoForms2.");
}

function createMissingPlaceholderError(formId: number) {
  return new Error(`Missing hidden Marketo placeholder form for ID ${formId}.`);
}

function createLoadTimeoutError() {
  return new Error("Timed out waiting for the Marketo submission to finish.");
}

function createValidationError() {
  return new Error("Marketo validation blocked the submission.");
}

function createNotReadyError() {
  return new Error("Marketo form is not ready yet.");
}

function createInFlightError() {
  return new Error("A Marketo submission is already in flight.");
}

function normalizeFormValues(values: FormValues): FormValues {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value ?? ""]),
  ) as FormValues;
}

export function useMarketoForm({
  marketoOrigin,
  munchkinId,
  formId,
  enabled,
}: UseMarketoFormOptions): UseMarketoFormResult {
  const script = useMarketoFormsScript(marketoOrigin);
  const [state, setState] = useState<{
    error: Error | null;
    status: MarketoFormStatus;
  }>({
    status: enabled ? "loading" : "idle",
    error: null,
  });
  const formRef = useRef<MktoForm | null>(null);
  const loadedKeyRef = useRef<string | null>(null);
  const pendingSubmissionRef = useRef<PendingSubmission | null>(null);

  const settleSubmission = useCallback((settler: "resolve" | "reject", error?: Error) => {
    const pending = pendingSubmissionRef.current;
    if (!pending) {
      return;
    }

    window.clearTimeout(pending.timeoutId);
    pendingSubmissionRef.current = null;

    if (settler === "resolve") {
      pending.resolve();
      return;
    }

    pending.reject(error ?? createLoadTimeoutError());
  }, []);

  useEffect(() => {
    if (!enabled) {
      setState({ status: "idle", error: null });
      return;
    }

    if (!marketoOrigin || !munchkinId || !Number.isFinite(formId)) {
      setState({
        status: "error",
        error: createMissingConfigError(),
      });
      return;
    }

    if (script.status === "error") {
      setState({ status: "error", error: script.error });
      return;
    }

    if (script.status !== "ready") {
      setState({ status: "loading", error: null });
      return;
    }

    if (!window.MktoForms2) {
      setState({ status: "error", error: createMissingGlobalError() });
      return;
    }

    const loadKey = `${marketoOrigin}::${munchkinId}::${formId}`;
    if (loadedKeyRef.current === loadKey && formRef.current) {
      setState({ status: "ready", error: null });
      return;
    }

    const placeholder = document.getElementById(`mktoForm_${formId}`);
    if (!placeholder) {
      setState({
        status: "error",
        error: createMissingPlaceholderError(formId),
      });
      return;
    }

    let cancelled = false;
    loadedKeyRef.current = loadKey;
    setState({ status: "loading", error: null });

    window.MktoForms2.loadForm(marketoOrigin, munchkinId, formId, (form) => {
      if (cancelled) {
        return;
      }

      formRef.current = form;
      form.onSuccess(() => {
        settleSubmission("resolve");
        return false;
      });
      form.onValidate((isValid) => {
        if (!isValid) {
          settleSubmission("reject", createValidationError());
        }
      });

      setState({ status: "ready", error: null });
    });

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    formId,
    marketoOrigin,
    munchkinId,
    script.error,
    script.status,
    settleSubmission,
  ]);

  const submit = useCallback(
    (values: FormValues) => {
      const form = formRef.current;
      if (!form || state.status !== "ready") {
        return Promise.reject(createNotReadyError());
      }

      if (pendingSubmissionRef.current) {
        return Promise.reject(createInFlightError());
      }

      return new Promise<void>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          settleSubmission("reject", createLoadTimeoutError());
        }, SUBMIT_TIMEOUT_MS);
        const normalizedValues = normalizeFormValues(values);

        pendingSubmissionRef.current = {
          resolve,
          reject,
          timeoutId,
        };

        form.setValues(normalizedValues);
        form.addHiddenFields(normalizedValues);
        form.submittable(true);
        form.submit();
      });
    },
    [settleSubmission, state.status],
  );

  return {
    status: state.status,
    error: state.error,
    submit,
  };
}
