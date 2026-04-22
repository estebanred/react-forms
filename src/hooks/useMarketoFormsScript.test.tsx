import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMarketoFormsScript } from "./useMarketoFormsScript";

describe("useMarketoFormsScript", () => {
  afterEach(() => {
    delete window.MktoForms2;
    document.head.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("injects the Forms 2.0 script once and shares it across hook instances", async () => {
    const marketoOrigin = "https://marketing.example.com";

    const first = renderHook(() => useMarketoFormsScript(marketoOrigin));
    const second = renderHook(() => useMarketoFormsScript(marketoOrigin));

    const scripts = document.head.querySelectorAll(
      `script[src="${marketoOrigin}/js/forms2/js/forms2.min.js"]`,
    );

    expect(scripts).toHaveLength(1);
    expect(first.result.current.status).toBe("loading");
    expect(second.result.current.status).toBe("loading");

    window.MktoForms2 = {
      loadForm: vi.fn(),
    };
    scripts[0].dispatchEvent(new Event("load"));

    await waitFor(() => {
      expect(first.result.current.status).toBe("ready");
      expect(second.result.current.status).toBe("ready");
    });
  });

  it("surfaces a script load failure", async () => {
    const marketoOrigin = "https://blocked.example.com";
    const { result } = renderHook(() => useMarketoFormsScript(marketoOrigin));

    const script = document.head.querySelector<HTMLScriptElement>(
      `script[src="${marketoOrigin}/js/forms2/js/forms2.min.js"]`,
    );

    expect(script).not.toBeNull();
    script?.dispatchEvent(new Event("error"));

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    expect(result.current.error?.message).toContain(
      "Failed to load Marketo Forms 2.0 script",
    );
  });
});
