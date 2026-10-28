import "server-only";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { accounts } from "@/lib/db/schema";

/**
 * Get a valid GitHub access token for the given user.
 * better-auth auto-refreshes expired tokens via stored refresh token.
 */
export async function getUserGitHubToken(
  userId: string,
): Promise<string | null> {
  try {
    // better-auth 1.7 selects the account by its row id, not by provider.
    const [account] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(eq(accounts.userId, userId), eq(accounts.providerId, "github")),
      )
      .limit(1);
    if (!account) {
      return null;
    }

    const result = await auth.api.getAccessToken({
      body: { accountId: account.id, userId },
    });

    return result?.accessToken ?? null;
  } catch (error) {
    // "Account not found" is expected when the user hasn't linked GitHub —
    // only log unexpected errors.
    const isExpected =
      error instanceof Error && error.message === "Account not found";
    if (!isExpected) {
      console.error("Error fetching GitHub token:", error);
    }
    return null;
  }
}

export async function getGitHubAppUserToken(
  userId: string,
): Promise<string | null> {
  return getUserGitHubToken(userId);
}
