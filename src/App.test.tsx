import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { fetchMarketoForm } from "./utils/fetchMarketoForm";
import { useMarketoForm } from "./hooks/useMarketoForm";
import type { FormField, FormValues } from "./types/FormData";

vi.mock("./utils/fetchMarketoForm", () => ({
  fetchMarketoForm: vi.fn(),
}));

vi.mock("./hooks/useMarketoForm", () => ({
  useMarketoForm: vi.fn(),
}));

const mockedFetchMarketoForm = vi.mocked(fetchMarketoForm);
const mockedUseMarketoForm = vi.mocked(useMarketoForm);

type MockMarketoState = {
  error: Error | null;
  status: "loading" | "ready" | "error";
  submit: (values: FormValues) => Promise<void>;
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function renderApp(client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
}

describe("App", () => {
  let marketoState: MockMarketoState;

  beforeEach(() => {
    const fields: FormField[] = [
      {
        name: "FirstName",
        label: "First Name",
        required: false,
        type: "Text",
      },
    ];

    mockedFetchMarketoForm.mockResolvedValue({
      fields,
      defaultValues: {
        FirstName: "",
      },
    });

    marketoState = {
      status: "loading",
      error: null,
      submit: vi.fn().mockRejectedValue(new Error("stale submit")),
    };

    mockedUseMarketoForm.mockImplementation(() => marketoState);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("submits with the latest Marketo bridge after it becomes ready", async () => {
    const user = userEvent.setup();
    const client = createQueryClient();
    const view = renderApp(client);

    await screen.findByRole("textbox", { name: "First Name" });
    expect(
      screen.getByRole("button", { name: "Preparing..." }),
    ).toBeDisabled();

    const latestSubmit = vi.fn().mockResolvedValue(undefined);
    const staleSubmit = marketoState.submit;

    marketoState = {
      status: "ready",
      error: null,
      submit: latestSubmit,
    };

    view.rerender(
      <QueryClientProvider client={client}>
        <App />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Send message" }),
      ).toBeEnabled();
    });

    await user.type(
      screen.getByRole("textbox", { name: "First Name" }),
      "Esteban",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => {
      expect(latestSubmit).toHaveBeenCalledWith({ FirstName: "Esteban" });
    });

    expect(staleSubmit).not.toHaveBeenCalled();
  });
});
