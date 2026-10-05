import "server-only";
import { unstable_rethrow } from "next/navigation";
import { adminErrorMessage, type MutationResult } from "./admin-errors";

export async function runAdminMutation(operation: () => Promise<void>): Promise<MutationResult> {
  try {
    await operation();
    return {};
  } catch (error) {
    unstable_rethrow(error);
    console.error("Admin mutation failed", error);
    return { error: adminErrorMessage(error, "Changes could not be saved. Please try again.") };
  }
}
