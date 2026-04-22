import { useEffect, useState } from "react";

export type MarketoScriptStatus = "idle" | "loading" | "ready" | "error";

type MarketoScriptState = {
  status: MarketoScriptStatus;
  error: Error | null;
};

const scriptPromises = new Map<string, Promise<void>>();

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, "");
}

function createMissingOriginError() {
  return new Error("VITE_MARKETO_URL must be configured to load Forms 2.0.");
}

function createScriptLoadError(src: string) {
  return new Error(`Failed to load Marketo Forms 2.0 script: ${src}`);
}

function ensureMarketoScript(marketoOrigin: string): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(
      new Error("Marketo Forms 2.0 can only load in a browser environment."),
    );
  }

  if (window.MktoForms2) {
    return Promise.resolve();
  }

  const normalizedOrigin = normalizeOrigin(marketoOrigin);
  const src = `${normalizedOrigin}/js/forms2/js/forms2.min.js`;
  const cachedPromise = scriptPromises.get(src);
  if (cachedPromise) {
    return cachedPromise;
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${src}"]`,
  );

  const promise = new Promise<void>((resolve, reject) => {
    const handleLoad = () => {
      if (window.MktoForms2) {
        resolve();
        return;
      }

      reject(createScriptLoadError(src));
    };

    const handleError = () => {
      reject(createScriptLoadError(src));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.marketoFormsOrigin = normalizedOrigin;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    scriptPromises.delete(src);
    throw error;
  });

  scriptPromises.set(src, promise);
  return promise;
}

export function useMarketoFormsScript(
  marketoOrigin: string | undefined,
): MarketoScriptState {
  const [state, setState] = useState<MarketoScriptState>(() => ({
    status: marketoOrigin ? "loading" : "idle",
    error: null,
  }));

  useEffect(() => {
    if (!marketoOrigin) {
      setState({
        status: "error",
        error: createMissingOriginError(),
      });
      return;
    }

    if (window.MktoForms2) {
      setState({ status: "ready", error: null });
      return;
    }

    let cancelled = false;
    setState({ status: "loading", error: null });

    void ensureMarketoScript(marketoOrigin)
      .then(() => {
        if (cancelled) {
          return;
        }

        setState({ status: "ready", error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setState({
          status: "error",
          error:
            error instanceof Error
              ? error
              : new Error("Failed to load Marketo Forms 2.0."),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [marketoOrigin]);

  return state;
}
