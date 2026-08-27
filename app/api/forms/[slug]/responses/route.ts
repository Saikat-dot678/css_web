import { NextResponse } from "next/server";
import { FormSubmissionError } from "@/lib/forms/submission";
import { submitFormData } from "@/lib/forms/submit-server";
import { getFormBySlug } from "@/lib/repositories/forms";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const form = await getFormBySlug(slug);
    if (!form || form.kind !== "standalone") return NextResponse.json({ message: "Form not found." }, { status: 404 });
    const data = await request.formData();
    const response = await submitFormData({ form, data });
    return NextResponse.json({ id: response.id, message: form.successMessage || "Response received." }, { status: 201 });
  } catch (error) {
    if (error instanceof FormSubmissionError) return NextResponse.json({ message: error.message }, { status: error.status });
    const status = typeof (error as { status?: unknown })?.status === "number" ? Number((error as { status: number }).status) : 500;
    if (status !== 500) return NextResponse.json({ message: error instanceof Error ? error.message : "Upload rejected." }, { status });
    console.error("Standalone form submission failed", error);
    return NextResponse.json({ message: "The form could not be submitted." }, { status: 500 });
  }
}
