import Email from "./Email";
import Text from "./Text";
import TextArea from "./TextArea";
import type { FormApi, FormField } from "./types";

const formFields = [
  {
    type: "Text",
    name: "fullName",
    label: "Full name",
    placeholder: "Ada Lovelace",
  },
  {
    type: "Email",
    name: "email",
    label: "Email",
    placeholder: "ada@analytical.engine",
  },
  {
    type: "TextArea",
    name: "message",
    label: "Message",
    placeholder: "Tell us what you want to build with TanStack Form.",
  },
] satisfies FormField[];

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
