import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMarketoForm } from "./useMarketoForm";
import { useMarketoFormsScript } from "./useMarketoFormsScript";
import type { MktoForm, MktoForms2Global } from "../types/MarketoForms2";

vi.mock("./useMarketoFormsScript", () => ({
  useMarketoFormsScript: vi.fn(),
}));

const mockedUseMarketoFormsScript = vi.mocked(useMarketoFormsScript);

let successHandlers: Array<
  (values: Record<string, string>, followUpUrl: string) => boolean | void
>;
let validateHandlers: Array<(isValid: boolean) => void>;

function createMockForm(): MktoForm {
  return {
    addHiddenFields: vi.fn(),
    getId: vi.fn(() => 7205),
    onSubmit: vi.fn(),
    onSuccess: vi.fn((handler) => {
      successHandlers.push(handler);
    }),
    onValidate: vi.fn((handler) => {
      validateHandlers.push(handler);
    }),
    setValues: vi.fn(),
    submit: vi.fn(),
    submittable: vi.fn(),
    vals: vi.fn(() => ({})),
  };
}

function renderHiddenPlaceholder(formId: number) {
  const placeholder = document.createElement("form");
  placeholder.id = `mktoForm_${formId}`;
  document.body.appendChild(placeholder);
}

describe("useMarketoForm", () => {
  beforeEach(() => {
    successHandlers = [];
    validateHandlers = [];
    mockedUseMarketoFormsScript.mockReturnValue({
      status: "ready",
      error: null,
    });
  });

  afterEach(() => {
    delete window.MktoForms2;
    document.body.innerHTML = "";
    vi.useRealTimers();
    vi.clearAllMocks();
    mockedUseMarketoFormsScript.mockReset();
  });

  it("loads the hidden Marketo form and resolves submissions on success", async () => {
    const formId = 7205;
    const form = createMockForm();
    const loadForm: MktoForms2Global["loadForm"] = vi.fn(
      (_origin, _munchkinId, _formId, onReady) => {
        onReady(form);
      },
    );

    window.MktoForms2 = { loadForm };
    renderHiddenPlaceholder(formId);

    const { result, rerender } = renderHook(() =>
      useMarketoForm({
        marketoOrigin: "https://marketing.example.com",
        munchkinId: "123-ABC-456",
        formId,
        enabled: true,
      }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    rerender();

    expect(loadForm).toHaveBeenCalledTimes(1);

    const values = { Email: "person@example.com" };
    const submissionPromise = result.current.submit(values);

    expect(form.setValues).toHaveBeenCalledWith(values);
    expect(form.addHiddenFields).toHaveBeenCalledWith(values);
    expect(form.submittable).toHaveBeenCalledWith(true);
    expect(form.submit).toHaveBeenCalledTimes(1);

    successHandlers[0]?.(values, "");

    await expect(submissionPromise).resolves.toBeUndefined();
  });

  it("rejects the pending submission when Marketo validation fails", async () => {
    const formId = 7205;
    const form = createMockForm();
    window.MktoForms2 = {
      loadForm: vi.fn((_origin, _munchkinId, _formId, onReady) => {
        onReady(form);
      }),
    };
    renderHiddenPlaceholder(formId);

    const { result } = renderHook(() =>
      useMarketoForm({
        marketoOrigin: "https://marketing.example.com",
        munchkinId: "123-ABC-456",
        formId,
        enabled: true,
      }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    const submissionPromise = result.current.submit({ Email: "invalid" });

    validateHandlers[0]?.(false);

    await expect(submissionPromise).rejects.toThrow(
      "Marketo validation blocked the submission.",
    );
  });

  it("times out a blocked submission and allows a retry", async () => {
    const formId = 7205;
    const form = createMockForm();
    window.MktoForms2 = {
      loadForm: vi.fn((_origin, _munchkinId, _formId, onReady) => {
        onReady(form);
      }),
    };
    renderHiddenPlaceholder(formId);

    const { result } = renderHook(() =>
      useMarketoForm({
        marketoOrigin: "https://marketing.example.com",
        munchkinId: "123-ABC-456",
        formId,
        enabled: true,
      }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    vi.useFakeTimers();

    const firstSubmission = result.current.submit({ Email: "blocked@example.com" });
    const firstSubmissionAssertion = expect(firstSubmission).rejects.toThrow(
      "Timed out waiting for the Marketo submission to finish.",
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    await firstSubmissionAssertion;

    const retryValues = { Email: "retry@example.com" };
    const secondSubmission = result.current.submit(retryValues);

    expect(form.submit).toHaveBeenCalledTimes(2);

    successHandlers[0]?.(retryValues, "");

    await expect(secondSubmission).resolves.toBeUndefined();
  });
});
