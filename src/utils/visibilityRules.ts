import type {
  FormField,
  FormFieldOption,
  FormValues,
  VisibilityRuleItem,
} from "../types/FormData";

type ResolvedField = {
  field: FormField;
  isVisible: boolean;
};

function isOptionsField(
  field: FormField,
): field is Extract<FormField, { options: FormFieldOption[] }> {
  return "options" in field;
}

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

function optionMatchesValue(option: FormFieldOption, value: string) {
  const normalizedValue = normalize(value);
  return (
    normalize(option.value) === normalizedValue ||
    normalize(option.label) === normalizedValue
  );
}

function getOptionComparableValues(field: FormField | undefined, value: string) {
  if (!field || !value) return [];

  if (isOptionsField(field)) {
    const selectedValues =
      field.type === "Checkbox" ? value.split(",").filter(Boolean) : [value];

    return selectedValues.flatMap((selectedValue) =>
      field.options
        .filter((option) => optionMatchesValue(option, selectedValue))
        .flatMap((option) => [option.value, option.label]),
    );
  }

  if (field.type === "SingleCheckbox" && field.option) {
    const optionValue = field.option.value ?? "true";
    return optionMatchesValue({ ...field.option, value: optionValue }, value)
      ? [optionValue, field.option.label]
      : [];
  }

  return [];
}

function getComparableValues(
  rule: VisibilityRuleItem,
  values: FormValues,
  fields: FormField[] = [],
) {
  const value = normalize(values[rule.subjectField]);
  const subjectField = fields.find((field) => field.name === rule.subjectField);
  const optionValues = getOptionComparableValues(subjectField, value).map(
    normalize,
  );

  return Array.from(new Set([value, ...optionValues]));
}

function matchesRule(
  rule: VisibilityRuleItem,
  values: FormValues,
  fields?: FormField[],
) {
  const value = normalize(values[rule.subjectField]);
  const comparableValues = getComparableValues(rule, values, fields);
  const ruleValues = rule.values.map(normalize);

  switch (rule.operator) {
    case "equal":
      return ruleValues.some((ruleValue) =>
        comparableValues.includes(ruleValue),
      );
    case "notEqual":
      return ruleValues.every(
        (ruleValue) => !comparableValues.includes(ruleValue),
      );
    case "contains":
      return ruleValues.some((ruleValue) =>
        comparableValues.some((comparableValue) =>
          comparableValue.includes(ruleValue),
        ),
      );
    case "notContains":
      return ruleValues.every((ruleValue) =>
        comparableValues.every(
          (comparableValue) => !comparableValue.includes(ruleValue),
        ),
      );
    case "isEmpty":
      return value === "";
    case "isNotEmpty":
      return value !== "";
    default:
      return false;
  }
}

function getMatchingRule(
  field: FormField,
  values: FormValues,
  fields?: FormField[],
) {
  return field.visibilityRule?.rules.find((rule) =>
    matchesRule(rule, values, fields),
  );
}

function applyRuleData(field: FormField, rule: VisibilityRuleItem): FormField {
  const label =
    rule.altLabel === null || rule.altLabel === undefined
      ? field.label
      : rule.altLabel;
  const filteredOptions = rule.picklistFilterValues;

  if (filteredOptions?.length) {
    if (isOptionsField(field)) {
      return { ...field, label, options: filteredOptions };
    }

    if (field.type === "SingleCheckbox") {
      return { ...field, label, option: filteredOptions[0] };
    }
  }

  return { ...field, label };
}

export function resolveFieldVisibility(
  field: FormField,
  values: FormValues,
  fields?: FormField[],
): ResolvedField {
  if (!field.visibilityRule) {
    return { field, isVisible: true };
  }

  const matchingRule = getMatchingRule(field, values, fields);
  const isVisibleByDefault = field.visibilityRule.defaultVisibility === "show";
  const isVisible = matchingRule ? !isVisibleByDefault : isVisibleByDefault;

  return {
    field: matchingRule ? applyRuleData(field, matchingRule) : field,
    isVisible,
  };
}

export function hasOptionValue(field: FormField, value: string) {
  if (!value) return true;

  if (isOptionsField(field)) {
    if (field.type === "Checkbox") {
      const selectedValues = value.split(",").filter(Boolean);
      return selectedValues.every((selectedValue) =>
        field.options.some((option) =>
          optionMatchesValue(option, selectedValue),
        ),
      );
    }

    return field.options.some((option) => optionMatchesValue(option, value));
  }

  if (field.type === "SingleCheckbox") {
    if (!field.option) return normalize(value) === "true";

    return optionMatchesValue(
      { ...field.option, value: field.option.value ?? "true" },
      value,
    );
  }

  return true;
}
