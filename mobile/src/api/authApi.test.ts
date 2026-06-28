import { emailPasswordLogin, googleIdTokenLogin } from "./authApi";

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: async () => body,
  });
}

beforeEach(() => {
  global.fetch = jest.fn();
});

describe("googleIdTokenLogin", () => {
  it("returns token + email on success", async () => {
    mockFetchOnce({ data: { token: "tok", user: { email: "a@b.com" } } });
    await expect(googleIdTokenLogin("id-token")).resolves.toEqual({
      token: "tok",
      email: "a@b.com",
    });
  });

  it("includes locale in the request body when provided", async () => {
    mockFetchOnce({ data: { token: "tok", user: { email: "a@b.com" } } });
    await googleIdTokenLogin("id-token", "es");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ idToken: "id-token", locale: "es" });
  });

  it("returns null on a non-OK response", async () => {
    mockFetchOnce({}, false, 401);
    await expect(googleIdTokenLogin("id-token")).resolves.toBeNull();
  });

  it("returns null when the token is missing", async () => {
    mockFetchOnce({ data: { user: { email: "a@b.com" } } });
    await expect(googleIdTokenLogin("id-token")).resolves.toBeNull();
  });

  it("returns null when fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("offline"));
    await expect(googleIdTokenLogin("id-token")).resolves.toBeNull();
  });
});

describe("emailPasswordLogin", () => {
  it("returns ok with token + email on success", async () => {
    mockFetchOnce({ data: { token: "tok", user: { email: "a@b.com" } } });
    await expect(emailPasswordLogin("a@b.com", "pw")).resolves.toEqual({
      ok: true,
      token: "tok",
      email: "a@b.com",
    });
  });

  it("surfaces the structured error payload on a non-OK response", async () => {
    mockFetchOnce(
      { error: { code: "invalid_login", errors: [{ field: null, code: "invalid_login" }] } },
      false,
      401,
    );
    const result = await emailPasswordLogin("a@b.com", "wrong");
    expect(result).toEqual({
      ok: false,
      error: { code: "invalid_login", errors: [{ field: null, code: "invalid_login", properties: undefined }] },
    });
  });

  it("maps a thrown fetch to a network_error payload", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("offline"));
    const result = await emailPasswordLogin("a@b.com", "pw");
    expect(result).toEqual({ ok: false, error: { code: "network_error", errors: [] } });
  });

  it("returns unknown_error when an OK response lacks a token", async () => {
    mockFetchOnce({ data: { user: { email: "a@b.com" } } });
    const result = await emailPasswordLogin("a@b.com", "pw");
    expect(result).toEqual({ ok: false, error: { code: "unknown_error", errors: [] } });
  });
});
