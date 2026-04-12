export type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
};

export type FormFieldName = keyof FormValues;

export type FormField =
  | {
      type: "Text";
      name: FormFieldName;
      label: string;
      placeholder?: string;
    }
  | {
      type: "Email";
      name: FormFieldName;
      label: string;
      placeholder?: string;
    }
  | {
      type: "TextArea";
      name: FormFieldName;
      label: string;
      placeholder?: string;
    };

export const formFields = [
  {
    type: "Text",
    name: "firstName",
    label: "First name",
    placeholder: "First name",
  },
  {
    type: "Email",
    name: "email",
    label: "Email",
    placeholder: "test@test.com",
  },
  {
    type: "TextArea",
    name: "message",
    label: "Message",
    placeholder: "Tell us what you want to build with TanStack Form.",
  },
  {
    type: "Text",
    name: "lastName",
    label: "Last name",
    placeholder: "Last name",
  },
] satisfies FormField[];
