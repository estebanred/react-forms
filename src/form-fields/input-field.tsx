import type { ReactNode } from "react";

type InputFieldProps = {
  children: ReactNode;
  error?: string;
  isTouched: boolean;
  label: string;
};

function InputField({ children, error, isTouched, label }: InputFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-stone-200">{label}</span>
      {children}
      {isTouched && error ? (
        <p className="text-sm text-rose-300">{error}</p>
      ) : null}
    </label>
  );
}

export default InputField;
