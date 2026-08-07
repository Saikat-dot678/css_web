import { redirect } from "next/navigation";

export default async function EventFormAlias({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/admin/form-builder?event=${(await params).id}`);
}
