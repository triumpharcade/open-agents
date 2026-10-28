import { and, eq } from "drizzle-orm";
import { db } from "./client";
import { accounts } from "./schema";

export interface ProviderAccount {
  /** better-auth account row id, the selector `auth.api.getAccessToken` takes. */
  id: string;
  /** The provider's own id for the user (GitHub user id, Vercel user id). */
  accountId: string;
}

/**
 * Find the user's linked account row for an OAuth provider, or null when the
 * user has not linked that provider.
 */
export async function getProviderAccount(
  userId: string,
  providerId: string,
): Promise<ProviderAccount | null> {
  const [row] = await db
    .select({ id: accounts.id, accountId: accounts.accountId })
    .from(accounts)
    .where(
      and(eq(accounts.userId, userId), eq(accounts.providerId, providerId)),
    )
    .limit(1);
  return row ?? null;
}
