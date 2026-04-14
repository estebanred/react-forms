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

function matchesRule(rule: VisibilityRuleItem, values: FormValues) {
  const value = normalize(values[rule.subjectField]);
  const ruleValues = rule.values.map(normalize);

  switch (rule.operator) {
    case "equal":
      return ruleValues.includes(value);
    case "notEqual":
      return !ruleValues.includes(value);
    case "contains":
      return ruleValues.some((ruleValue) => value.includes(ruleValue));
    case "notContains":
      return ruleValues.every((ruleValue) => !value.includes(ruleValue));
    case "isEmpty":
      return value === "";
    case "isNotEmpty":
      return value !== "";
    default:
      return false;
  }
}

function getMatchingRule(field: FormField, values: FormValues) {
  return field.visibilityRule?.rules.find((rule) => matchesRule(rule, values));
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
): ResolvedField {
  if (!field.visibilityRule) {
    return { field, isVisible: true };
  }

  const matchingRule = getMatchingRule(field, values);
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
        field.options.some((option) => option.value === selectedValue),
      );
    }

    return field.options.some((option) => option.value === value);
  }

  if (field.type === "SingleCheckbox") {
    return value === (field.option?.value ?? "true");
  }

  return true;
}
