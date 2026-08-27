import type { DatabaseAdapter } from "@/lib/db/adapter";
import { createId, nowIso } from "@/lib/utils";
import { formDefinitionSchema, formResponseSchema } from "@/lib/validation/forms";
import type { FormDefinition, FormResponse } from "@/types/forms";
import { normalizeForm, normalizeResponse } from "./model";

export type FormInput = Omit<FormDefinition, "id" | "createdAt" | "updatedAt">;
export type FormResponseInput = Omit<FormResponse, "id" | "createdAt" | "updatedAt">;

export class FormService {
  constructor(private readonly database: DatabaseAdapter) {}

  async listForms(): Promise<FormDefinition[]> {
    const raw = await this.database.list<FormDefinition>("registrationForms");
    return raw.map(normalizeForm).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getFormById(id: string) {
    const raw = await this.database.findById<FormDefinition>("registrationForms", id);
    return raw ? normalizeForm(raw) : null;
  }

  async getFormBySlug(slug: string) {
    const matches = (await this.listForms()).filter((form) => form.slug === slug);
    return matches.find((form) => form.status === "published") ?? matches.find((form) => form.status === "closed") ?? matches[0] ?? null;
  }

  async getFormByEventId(eventId: string) {
    return (await this.listForms()).find((form) => form.kind === "event" && form.eventId === eventId) ?? null;
  }

  private async assertPublishedSlugAvailable(slug: string, excludeId?: string) {
    const clash = (await this.listForms()).find((form) => form.status === "published" && form.slug === slug && form.id !== excludeId);
    if (clash) throw new Error(`A published form already uses the slug “${slug}”.`);
  }

  async createForm(input: FormInput): Promise<FormDefinition> {
    const timestamp = nowIso();
    const parsed = formDefinitionSchema.parse({
      ...input,
      id: createId("form"),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    if (parsed.status === "published") await this.assertPublishedSlugAvailable(parsed.slug);
    return this.database.insert("registrationForms", parsed);
  }

  async updateForm(id: string, patch: Partial<FormInput>): Promise<FormDefinition> {
    const current = await this.getFormById(id);
    if (!current) throw new Error("Form not found.");
    const parsed = formDefinitionSchema.parse({ ...current, ...patch, id, updatedAt: nowIso() });
    if (parsed.status === "published") await this.assertPublishedSlugAvailable(parsed.slug, id);
    return this.database.update("registrationForms", id, parsed);
  }

  async duplicateForm(id: string): Promise<FormDefinition> {
    const source = await this.getFormById(id);
    if (!source) throw new Error("Form not found.");
    const suffix = crypto.randomUUID().slice(0, 6).toLowerCase();
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...copy } = source;
    return this.createForm({
      ...copy,
      title: `${source.title} copy`,
      slug: `${source.slug}-copy-${suffix}`,
      kind: "standalone",
      eventId: undefined,
      eventOwned: false,
      status: "draft",
      fields: source.fields.map((field) => ({ ...structuredClone(field), id: crypto.randomUUID() })),
    });
  }

  async listResponses(filters: { formId?: string; eventId?: string } = {}): Promise<FormResponse[]> {
    const forms = await this.listForms();
    const raw = await this.database.list<FormResponse>("registrations");
    return raw
      .map((response) => normalizeResponse(response, forms))
      .filter((response) => !filters.formId || response.formId === filters.formId)
      .filter((response) => !filters.eventId || response.eventId === filters.eventId)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }

  async getResponseById(id: string) {
    const forms = await this.listForms();
    const raw = await this.database.findById<FormResponse>("registrations", id);
    return raw ? normalizeResponse(raw, forms) : null;
  }

  async countResponses(formId: string) {
    return (await this.listResponses({ formId })).length;
  }

  async createResponse(input: FormResponseInput): Promise<FormResponse> {
    const timestamp = nowIso();
    const parsed = formResponseSchema.parse({
      ...input,
      id: createId("response"),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    return this.database.insert("registrations", parsed);
  }

  async deleteResponse(id: string) {
    return this.database.remove("registrations", id);
  }

  async deleteForm(id: string) {
    const count = await this.countResponses(id);
    if (count > 0) throw new Error(`This form has ${count} response${count === 1 ? "" : "s"}. Delete the responses first.`);
    return this.database.remove("registrationForms", id);
  }
}
