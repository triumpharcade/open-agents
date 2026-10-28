import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { getProviderAccount } from "@/lib/db/accounts";

export interface UserVercelAuthInfo {
  token: string;
  expiresAt: number;
  externalId: string;
}

/**
 * Get a valid Vercel access token plus CLI-relevant metadata for the given user.
 * better-auth auto-refreshes expired tokens via stored refresh token.
 */
export async function getUserVercelAuthInfo(
  userId: string,
): Promise<UserVercelAuthInfo | null> {
  try {
    const account = await getProviderAccount(userId, "vercel");
    if (!account) {
      return null;
    }

    const result = await auth.api.getAccessToken({
      body: { accountId: account.id, userId },
      headers: await headers(),
    });

    if (!result?.accessToken) {
      return null;
    }

    return {
      token: result.accessToken,
      expiresAt: result.accessTokenExpiresAt
        ? Math.floor(new Date(result.accessTokenExpiresAt).getTime() / 1000)
        : Math.floor(Date.now() / 1000) + 3600,
      externalId: account.accountId,
    };
  } catch (error) {
    console.error("Error fetching Vercel auth:", error);
    return null;
  }
}

/**
 * Get a valid Vercel access token for the given user.
 */
export async function getUserVercelToken(
  userId: string,
): Promise<string | null> {
  try {
    const account = await getProviderAccount(userId, "vercel");
    if (!account) {
      return null;
    }

    const result = await auth.api.getAccessToken({
      body: { accountId: account.id, userId },
      headers: await headers(),
    });

    return result?.accessToken ?? null;
  } catch (error) {
    console.error("Error fetching Vercel token:", error);
    return null;
  }
}
