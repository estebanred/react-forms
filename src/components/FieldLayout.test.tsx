import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FieldLayout from "./FieldLayout";

const CHILD_TEXT = "child-content";

function renderLayout(
  overrides: Partial<React.ComponentProps<typeof FieldLayout>> = {},
) {
  const props: React.ComponentProps<typeof FieldLayout> = {
    children: <input data-testid="child" defaultValue={CHILD_TEXT} />,
    isTouched: false,
    label: "First name",
    ...overrides,
  };
  return render(<FieldLayout {...props} />);
}

describe("FieldLayout", () => {
  describe("label", () => {
    it("renders the label text when label is truthy", () => {
      renderLayout({ label: "Email address" });
      expect(screen.getByText("Email address")).toBeInTheDocument();
    });

    it("does not render the label span when label is an empty string", () => {
      const { container } = renderLayout({ label: "" });
      // There should be no <span> sibling for the label when falsy.
      expect(container.querySelector("span")).toBeNull();
    });
  });

  describe("children", () => {
    it("always renders children when label is present", () => {
      renderLayout({ label: "Visible" });
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("always renders children when label is empty", () => {
      renderLayout({ label: "" });
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("always renders children when isTouched and an error is present", () => {
      renderLayout({ isTouched: true, error: "Required" });
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  describe("error rendering (isTouched × error combinations)", () => {
    const errorCases: Array<{
      name: string;
      isTouched: boolean;
      error: string | undefined;
      expectVisible: boolean;
    }> = [
      {
        name: "isTouched=true + error=string → error visible",
        isTouched: true,
        error: "Required field",
        expectVisible: true,
      },
      {
        name: "isTouched=true + error=undefined → error hidden",
        isTouched: true,
        error: undefined,
        expectVisible: false,
      },
      {
        name: "isTouched=false + error=string → error hidden",
        isTouched: false,
        error: "Required field",
        expectVisible: false,
      },
      {
        name: "isTouched=false + error=undefined → error hidden",
        isTouched: false,
        error: undefined,
        expectVisible: false,
      },
    ];

    it.each(errorCases)(
      "$name",
      ({ isTouched, error, expectVisible }) => {
        const { container } = renderLayout({ isTouched, error });
        const errorEl = container.querySelector("p");
        if (expectVisible) {
          expect(errorEl).not.toBeNull();
          expect(errorEl).toHaveTextContent(error as string);
        } else {
          expect(errorEl).toBeNull();
        }
      },
    );

    it("does not render an error <p> for an empty-string error even when touched", () => {
      const { container } = renderLayout({ isTouched: true, error: "" });
      expect(container.querySelector("p")).toBeNull();
    });
  });
});
