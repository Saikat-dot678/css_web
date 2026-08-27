import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { createForm, duplicateForm } from "@/lib/repositories/forms";
import { slugify } from "@/lib/utils";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const payload = await request.json() as { title?: string; duplicateFromId?: string };
    if (payload.duplicateFromId) {
      const form = await duplicateForm(payload.duplicateFromId);
      return NextResponse.json({ form }, { status: 201 });
    }
    const title = String(payload.title || "Untitled form").trim() || "Untitled form";
    const suffix = crypto.randomUUID().slice(0, 6).toLowerCase();
    const form = await createForm({
      slug: `${slugify(title) || "form"}-${suffix}`,
      title,
      kind: "standalone",
      eventOwned: false,
      status: "draft",
      submitLabel: "Submit",
      successTitle: "Response received.",
      successMessage: "Your response has been recorded.",
      fields: [],
    });
    return NextResponse.json({ form }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Could not create form." }, { status: 422 });
  }
}
