import "server-only";
import { auth } from "@/lib/auth/config";
import { findUserProviderAccount } from "@/lib/db/accounts";

/**
 * Get a valid GitHub access token for the given user.
 * better-auth auto-refreshes expired tokens via stored refresh token.
 */
export async function getUserGitHubToken(
  userId: string,
): Promise<string | null> {
  try {
    const account = await findUserProviderAccount(userId, "github");
    if (!account) {
      return null;
    }

    const result = await auth.api.getAccessToken({
      body: { accountId: account.id, userId },
    });

    return result?.accessToken ?? null;
  } catch (error) {
    // "Account not found" is expected if the account is unlinked between the
    // lookup and the token read — only log unexpected errors.
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
