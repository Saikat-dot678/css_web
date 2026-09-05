import type { Event } from "@/types/event";
import type { FormDefinition, FormResponse } from "@/types/forms";

const csvCell = (value: unknown) => {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text.trimStart()) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
};
const inputFields = (form: FormDefinition) => form.fields.toSorted((a, b) => a.order - b.order).filter((field) => !["sectionHeading", "information", "divider"].includes(field.type));

export function uniqueFieldHeaders(form: FormDefinition) {
  const seen = new Map<string, number>();
  return inputFields(form).map((field) => {
    const count = (seen.get(field.label) || 0) + 1;
    seen.set(field.label, count);
    return { field, header: count === 1 ? field.label : `${field.label} (${count})` };
  });
}

export function createResponsesCsv(
  forms: FormDefinition[],
  responses: FormResponse[],
  events: Event[],
  selectedFormId?: string,
) {
  const formMap = new Map(forms.map((form) => [form.id, form]));
  const eventMap = new Map(events.map((event) => [event.id, event]));
  const selected = selectedFormId ? formMap.get(selectedFormId) : undefined;
  const columns = selected
    ? uniqueFieldHeaders(selected).map(({ field, header }) => ({ formId: selected.id, fieldId: field.id, header }))
    : forms.flatMap((form) => uniqueFieldHeaders(form).map(({ field, header }) => ({ formId: form.id, fieldId: field.id, header: `${form.title} / ${header}` })));

  const rows: unknown[][] = [
    ["Response ID", "Form", "Event", "Submitted", ...columns.map((column) => column.header)],
    ...responses.map((response) => {
      const form = formMap.get(response.formId);
      const event = response.eventId ? eventMap.get(response.eventId) : undefined;
      return [
        response.id,
        form?.title ?? response.formSlug,
        event?.title ?? response.eventSlug ?? "",
        response.submittedAt,
        ...columns.map((column) => {
          if (column.formId !== response.formId) return "";
          const answer = response.answers[column.fieldId];
          return Array.isArray(answer) ? answer.join("; ") : answer ?? "";
        }),
      ];
    }),
  ];
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
}
