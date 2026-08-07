import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { updateRegistrationForm } from "@/lib/repositories/forms";
import { formFieldSchema } from "@/lib/validation/forms";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const payload = await request.json() as { fields?: unknown };
    const fields = formFieldSchema.array().parse(payload.fields).map((field, order) => ({ ...field, order }));
    const form = await updateRegistrationForm((await context.params).id, fields);
    return NextResponse.json({ form });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Invalid form." }, { status: 422 });
  }
}
