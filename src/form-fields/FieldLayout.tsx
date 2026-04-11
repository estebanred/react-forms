import type { ReactNode } from "react";

type FieldLayoutProps = {
  children: ReactNode;
  error?: string;
  isTouched: boolean;
  label: string;
};

function FieldLayout({ children, error, isTouched, label }: FieldLayoutProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-stone-200">{label}</span>
      {children}
      {isTouched && error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : null}
    </label>
  );
}

export default FieldLayout;
