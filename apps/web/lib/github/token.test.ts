import { beforeEach, describe, expect, mock, test } from "bun:test";

let getAccessTokenResult: { accessToken?: string | null } | null;
let getAccessTokenError: Error | null;
let providerAccount: { id: string; accountId: string } | null;

const getAccessTokenSpy = mock(
  async (_input: { body: { accountId: string; userId: string } }) => {
    if (getAccessTokenError) {
      throw getAccessTokenError;
    }

    return getAccessTokenResult;
  },
);

mock.module("server-only", () => ({}));

mock.module("next/headers", () => ({
  headers: async () => {
    throw new Error("headers should not be called");
  },
}));

mock.module("@/lib/auth/config", () => ({
  auth: {
    api: {
      getAccessToken: getAccessTokenSpy,
    },
  },
}));

const getProviderAccountSpy = mock(
  async (_userId: string, _providerId: string) => providerAccount,
);

mock.module("@/lib/db/accounts", () => ({
  getProviderAccount: getProviderAccountSpy,
}));

const tokenModulePromise = import("./token");

describe("getUserGitHubToken", () => {
  beforeEach(() => {
    getAccessTokenSpy.mockClear();
    getProviderAccountSpy.mockClear();
    getAccessTokenResult = { accessToken: "ghu_test" };
    getAccessTokenError = null;
    providerAccount = { id: "account-row-1", accountId: "12345" };
  });

  test("looks up access tokens by the GitHub account row without request headers", async () => {
    const { getUserGitHubToken } = await tokenModulePromise;

    const token = await getUserGitHubToken("user-1");

    expect(token).toBe("ghu_test");
    expect(getProviderAccountSpy.mock.calls[0]).toEqual(["user-1", "github"]);
    expect(getAccessTokenSpy).toHaveBeenCalledTimes(1);
    expect(getAccessTokenSpy.mock.calls[0]?.[0]).toEqual({
      body: { accountId: "account-row-1", userId: "user-1" },
    });
  });

  test("returns null without calling better-auth when GitHub is not linked", async () => {
    const { getUserGitHubToken } = await tokenModulePromise;
    providerAccount = null;

    const token = await getUserGitHubToken("user-1");

    expect(token).toBeNull();
    expect(getAccessTokenSpy).not.toHaveBeenCalled();
  });

  test("returns null when better-auth token lookup fails", async () => {
    const { getUserGitHubToken } = await tokenModulePromise;
    getAccessTokenError = new Error("boom");

    const token = await getUserGitHubToken("user-1");

    expect(token).toBeNull();
  });
});

describe("getGitHubAppUserToken", () => {
  beforeEach(() => {
    getAccessTokenSpy.mockClear();
    getProviderAccountSpy.mockClear();
    getAccessTokenResult = { accessToken: "ghu_test" };
    getAccessTokenError = null;
    providerAccount = { id: "account-row-1", accountId: "12345" };
  });

  test("returns GitHub App user-to-server tokens", async () => {
    const { getGitHubAppUserToken } = await tokenModulePromise;

    const token = await getGitHubAppUserToken("user-1");

    expect(token).toBe("ghu_test");
  });
});
