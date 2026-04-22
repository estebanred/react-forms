import { useEffect, useMemo } from "react";
import { useStore } from "@tanstack/react-form";
import type { FormField } from "../types/FormData";
import type { FormApi } from "../types/types";
import {
  hasOptionValue,
  resolveFieldVisibility,
} from "../utils/visibilityRules";
import Text from "./field-types/Text";
import TextArea from "./field-types/TextArea";
import Email from "./field-types/Email";
import Phone from "./field-types/Phone";
import URL from "./field-types/URL";
import Integer from "./field-types/Integer";
import Float from "./field-types/Float";
import Currency from "./field-types/Currency";
import Percent from "./field-types/Percent";
import Score from "./field-types/Score";
import DateField from "./field-types/Date";
import DateTimeField from "./field-types/DateTime";
import Boolean from "./field-types/Boolean";
import Select from "./field-types/Select";
import Checkbox from "./field-types/Checkbox";
import Radio from "./field-types/Radio";
import SingleCheckbox from "./field-types/SingleCheckbox";
import Range from "./field-types/Range";
import HtmlText from "./field-types/HtmlText";
import Hidden from "./field-types/Hidden";

type FormFieldsProps = {
  form: FormApi;
  fields: FormField[];
};

function FormFields({ form, fields }: FormFieldsProps) {
  // Collect only the field names that drive visibility rules.
  const subjectFieldNames = useMemo(
    () => [
      ...new Set(
        fields.flatMap(
          (f) => f.visibilityRule?.rules.map((r) => r.subjectField) ?? [],
        ),
      ),
    ],
    [fields],
  );

  // Subscribe to a primitive string fingerprint of the visibility-controlling
  // values only. FormFields re-renders solely when one of those values changes,
  // not on every keystroke in unrelated fields.
  const visibilitySignature = useStore(form.store, (state) =>
    subjectFieldNames
      .map((name) => String(state.values[name] ?? ""))
      .join("\x00"),
  );

  const resolvedFields = useMemo(
    () => {
      const values = form.store.state.values;
      return fields.map((field) => resolveFieldVisibility(field, values, fields));
    },
    // visibilitySignature changes whenever a visibility-controlling value changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fields, visibilitySignature],
  );

  useEffect(() => {
    const values = form.store.state.values;
    resolvedFields.forEach(({ field, isVisible }) => {
      const value = values[field.name] ?? "";
      if (value && (!isVisible || !hasOptionValue(field, value))) {
        form.setFieldValue(field.name, "");
      }
    });
  }, [form, resolvedFields]);

  return resolvedFields.map(({ field, isVisible }) => {
    if (!isVisible) return null;

    switch (field.type) {
      case "Text":
        return <Text key={field.name} form={form} {...field} />;
      case "TextArea":
        return <TextArea key={field.name} form={form} {...field} />;
      case "Email":
        return <Email key={field.name} form={form} {...field} />;
      case "Phone":
        return <Phone key={field.name} form={form} {...field} />;
      case "URL":
        return <URL key={field.name} form={form} {...field} />;
      case "Integer":
        return <Integer key={field.name} form={form} {...field} />;
      case "Float":
        return <Float key={field.name} form={form} {...field} />;
      case "Currency":
        return <Currency key={field.name} form={form} {...field} />;
      case "Percent":
        return <Percent key={field.name} form={form} {...field} />;
      case "Score":
        return <Score key={field.name} form={form} {...field} />;
      case "Date":
        return <DateField key={field.name} form={form} {...field} />;
      case "DateTime":
        return <DateTimeField key={field.name} form={form} {...field} />;
      case "Boolean":
        return <Boolean key={field.name} form={form} {...field} />;
      case "Select":
        return <Select key={field.name} form={form} {...field} />;
      case "Checkbox":
        return <Checkbox key={field.name} form={form} {...field} />;
      case "Radio":
        return <Radio key={field.name} form={form} {...field} />;
      case "SingleCheckbox":
        return <SingleCheckbox key={field.name} form={form} {...field} />;
      case "Range":
        return <Range key={field.name} form={form} {...field} />;
      case "HtmlText":
        return <HtmlText key={field.name} {...field} />;
      case "Hidden":
        return <Hidden key={field.name} form={form} {...field} />;
    }
  });
}

export default FormFields;
