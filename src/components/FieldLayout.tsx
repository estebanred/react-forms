import type { ReactNode } from "react";

type FieldLayoutProps = {
  children: ReactNode;
  error?: string;
  isTouched: boolean;
  label: string;
  required?: boolean;
};

function FieldLayout({ children, error, isTouched, label, required }: FieldLayoutProps) {
  return (
    <label className="block space-y-2">
      {label ? (
        <span className="text-sm font-medium text-stone-200">
          {label}
          {required ? <span className="ml-0.5 text-red-300">*</span> : null}
        </span>
      ) : null}
      {children}
      {isTouched && error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : null}
    </label>
  );
}

export default FieldLayout;
