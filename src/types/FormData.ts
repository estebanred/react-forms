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
      required?: boolean;
    }
  | {
      type: "Email";
      name: FormFieldName;
      label: string;
      placeholder?: string;
      required?: boolean;
    }
  | {
      type: "TextArea";
      name: FormFieldName;
      label: string;
      placeholder?: string;
      required?: boolean;
    };

export const formFields = [
  {
    type: "Text",
    name: "firstName",
    label: "First name",
    placeholder: "First name",
    required: true,
  },
  {
    type: "Text",
    name: "lastName",
    label: "Last name",
    placeholder: "Last name",
    required: true,
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
] satisfies FormField[];
