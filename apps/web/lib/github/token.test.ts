import { beforeEach, describe, expect, mock, test } from "bun:test";

let getAccessTokenResult: { accessToken?: string | null } | null;
let getAccessTokenError: Error | null;
let githubAccountRows: { id: string }[];

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

mock.module("@/lib/db/client", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => githubAccountRows,
        }),
      }),
    }),
  },
}));

mock.module("@/lib/db/schema", () => ({
  accounts: {},
}));

const tokenModulePromise = import("./token");

describe("getUserGitHubToken", () => {
  beforeEach(() => {
    getAccessTokenSpy.mockClear();
    getAccessTokenResult = { accessToken: "ghu_test" };
    getAccessTokenError = null;
    githubAccountRows = [{ id: "account-1" }];
  });

  test("looks up access tokens by account row id without request headers", async () => {
    const { getUserGitHubToken } = await tokenModulePromise;

    const token = await getUserGitHubToken("user-1");

    expect(token).toBe("ghu_test");
    expect(getAccessTokenSpy).toHaveBeenCalledTimes(1);
    expect(getAccessTokenSpy.mock.calls[0]?.[0]).toEqual({
      body: { accountId: "account-1", userId: "user-1" },
    });
  });

  test("returns null without a token lookup when no GitHub account is linked", async () => {
    const { getUserGitHubToken } = await tokenModulePromise;
    githubAccountRows = [];

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
    getAccessTokenResult = { accessToken: "ghu_test" };
    getAccessTokenError = null;
    githubAccountRows = [{ id: "account-1" }];
  });

  test("returns GitHub App user-to-server tokens", async () => {
    const { getGitHubAppUserToken } = await tokenModulePromise;

    const token = await getGitHubAppUserToken("user-1");

    expect(token).toBe("ghu_test");
  });
});
