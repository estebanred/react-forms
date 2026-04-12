# Marketo Field Types Reference

A complete list of all field types supported by Marketo, including both lead database fields and form-specific input types.

**Sources:**
- [Marketo REST API — Field Types](https://experienceleague.adobe.com/en/docs/marketo-developer/marketo/rest/lead-database/field-types)
- [Marketo Custom Field Type Glossary](https://experienceleague.adobe.com/en/docs/marketo/using/product-docs/administration/field-management/custom-field-type-glossary?lang=en)
- [Marketo REST API — Forms](https://experienceleague.adobe.com/en/docs/marketo-developer/marketo/rest/assets/forms)

---

## Lead Database Field Types

These are the core data types available for lead/person fields in Marketo.

| Field Type  | API `dataType` | Description                                                               |
|-------------|----------------|---------------------------------------------------------------------------|
| Boolean     | `boolean`      | True/false binary value (e.g. "Is Customer")                              |
| Currency    | `currency`     | Float representing monetary amounts in the subscription's default currency |
| Date        | `date`         | Date-only value (no time), W3C/ISO 8601 format                            |
| Datetime    | `datetime`     | Date and time value, W3C/ISO 8601 format                                  |
| Email       | `email`        | Email address field                                                       |
| Float       | `float`        | Decimal/floating-point number                                             |
| Formula     | `formula`      | Read-only calculated value derived from other fields                      |
| Integer     | `integer`      | Whole number (no decimals)                                                |
| Percent     | `percent`      | Integer-based percentage value                                            |
| Phone       | `phone`        | Phone number                                                              |
| Reference   | `reference`    | String containing a foreign key to another record (system/API-level type) |
| Score       | `score`        | Integer manipulable via the "Change Score" flow step                      |
| String      | `string`       | Short text, max 255 characters                                            |
| Text Area   | `textarea`     | Long-form text, up to 30,000 bytes                                        |
| URL         | `url`          | Text restricted to URLs with protocols                                    |

---

## Form-Specific Field Types

These additional types are available as form input controls and may not correspond directly to a lead database field type.

| Field Type        | API `dataType`       | Description                                                                              |
|-------------------|----------------------|------------------------------------------------------------------------------------------|
| Checkbox          | `checkbox`           | Multi-select checkboxes (maps to a picklist field)                                       |
| Radio             | `radio`              | Single-select radio buttons (maps to a picklist field)                                   |
| Select / Picklist | `select` / `picklist`| Dropdown list                                                                            |
| Single Checkbox   | `single_checkbox`    | A single boolean checkbox, commonly used for opt-in consent                              |
| Slider / Range    | `range`              | Numeric slider input                                                                     |
| Rich Text         | `htmltext`           | HTML content block rendered inside the form (not a lead field; separate API endpoint)    |
| Hidden            | `hidden`             | Hidden field — passed silently on form submit, not visible to the user                   |

---

## Notes

- Most fields are **byte-limited** rather than character-limited. `String` is an exception and is character-limited (255 chars).
- `Formula` fields are **read-only** — their values are computed from other fields and cannot be set directly.
- `Reference` is an internal/system-level type used by the REST API and is not available as a custom field type in the Marketo UI.
- `htmltext` (Rich Text) is a form display element, not a lead data field. It is managed through a separate form fields API endpoint.
- `checkbox` and `radio` are UI renderings of picklist data — the underlying lead field is still of type `picklist`/`select`.
