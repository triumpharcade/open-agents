import { and, eq } from "drizzle-orm";
import { db } from "./client";
import { accounts } from "./schema";

export interface UserProviderAccount {
  /** better-auth account row id, which `auth.api.getAccessToken` selects by. */
  id: string;
  /** The provider's own id for the user (e.g. GitHub user id, Vercel `sub`). */
  accountId: string;
}

/**
 * Find the user's linked account for an OAuth provider, or null if not linked.
 */
export async function findUserProviderAccount(
  userId: string,
  providerId: "github" | "vercel",
): Promise<UserProviderAccount | null> {
  const rows = await db
    .select({ id: accounts.id, accountId: accounts.accountId })
    .from(accounts)
    .where(
      and(eq(accounts.userId, userId), eq(accounts.providerId, providerId)),
    )
    .limit(1);
  return rows[0] ?? null;
}
