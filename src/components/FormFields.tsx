import Email from "./field-types/Email";
import Text from "./field-types/Text";
import TextArea from "./field-types/TextArea";
import { formFields } from "../types/FormData";
import type { FormApi } from "../types/types";

type FormFieldsProps = {
  form: FormApi;
};

function FormFields({ form }: FormFieldsProps) {
  return formFields.map((field) => {
    switch (field.type) {
      case "Text":
        return <Text key={field.name} form={form} {...field} />;
      case "Email":
        return <Email key={field.name} form={form} {...field} />;
      case "TextArea":
        return <TextArea key={field.name} form={form} {...field} />;
    }
  });
}

export default FormFields;
