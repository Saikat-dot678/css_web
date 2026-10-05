"use client";

import { useActionState, type CSSProperties, type ReactNode } from "react";
import type { MutationResult } from "@/lib/admin-errors";

export function MutationForm({ action, children, className, style }: {
  action: (data: FormData) => Promise<MutationResult>;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const [state, formAction, pending] = useActionState(async (_previous: MutationResult, data: FormData) => action(data), {});
  return <form action={formAction} className={className} style={style}>
    {state.error && <p className="admin-error" role="alert">{state.error}</p>}
    <fieldset disabled={pending} style={{ display: "contents", border: 0, padding: 0, margin: 0, minWidth: 0 }}>{children}</fieldset>
    {pending && <p role="status">Saving…</p>}
  </form>;
}
