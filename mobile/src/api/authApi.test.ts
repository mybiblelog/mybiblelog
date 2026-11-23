import {
  sendEmailChangeCode,
  sendPasswordResetCode,
  changeEmailWithCode,
  resetPasswordWithCode,
  emailPasswordLogin,
  googleIdTokenLogin,
  registerAccount,
  resendVerification,
  checkPasswordResetCode,
  verifyEmailCode,
} from "./authApi";

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
      401
    );
    const result = await emailPasswordLogin("a@b.com", "wrong");
    expect(result).toEqual({
      ok: false,
      error: {
        code: "invalid_login",
        errors: [{ field: null, code: "invalid_login", properties: undefined }],
      },
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

describe("registerAccount", () => {
  it("returns ok on success", async () => {
    mockFetchOnce({});
    await expect(registerAccount("a@b.com", "pw")).resolves.toEqual({ ok: true });
  });

  it("surfaces the structured error payload on a non-OK response", async () => {
    mockFetchOnce({ error: { code: "email_taken", errors: [] } }, false, 409);
    const result = await registerAccount("a@b.com", "pw");
    expect(result).toEqual({ ok: false, error: { code: "email_taken", errors: [] } });
  });

  it("maps a thrown fetch to a network_error payload", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("offline"));
    const result = await registerAccount("a@b.com", "pw");
    expect(result).toEqual({ ok: false, error: { code: "network_error", errors: [] } });
  });
});

describe("verifyEmailCode", () => {
  it("returns ok with a token on success", async () => {
    mockFetchOnce({ data: { token: "tok" } });
    await expect(verifyEmailCode("a@b.com", "123456")).resolves.toEqual({
      ok: true,
      token: "tok",
    });
  });

  it("surfaces the structured error payload on a non-OK response", async () => {
    mockFetchOnce({ error: { code: "invalid_code", errors: [] } }, false, 400);
    const result = await verifyEmailCode("a@b.com", "000000");
    expect(result).toEqual({ ok: false, error: { code: "invalid_code", errors: [] } });
  });

  it("maps a thrown fetch to a network_error payload", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("offline"));
    const result = await verifyEmailCode("a@b.com", "123456");
    expect(result).toEqual({ ok: false, error: { code: "network_error", errors: [] } });
  });

  it("returns unknown_error when an OK response lacks a token", async () => {
    mockFetchOnce({ data: {} });
    const result = await verifyEmailCode("a@b.com", "123456");
    expect(result).toEqual({ ok: false, error: { code: "unknown_error", errors: [] } });
  });
});

describe("resendVerification", () => {
  it("returns ok on success", async () => {
    mockFetchOnce({});
    await expect(resendVerification("a@b.com")).resolves.toEqual({ ok: true });
  });

  it("is fail-soft: still returns ok on a non-OK response", async () => {
    mockFetchOnce({ error: { code: "rate_limited", errors: [] } }, false, 429);
    await expect(resendVerification("a@b.com")).resolves.toEqual({ ok: true });
  });

  it("maps a thrown fetch to a network_error payload", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("offline"));
    const result = await resendVerification("a@b.com");
    expect(result).toEqual({ ok: false, error: { code: "network_error", errors: [] } });
  });
});

describe("sendPasswordResetCode", () => {
  it("returns ok on success", async () => {
    mockFetchOnce({});
    await expect(sendPasswordResetCode("a@b.com")).resolves.toEqual({ ok: true });
  });

  it("is fail-soft: still returns ok on a non-OK response (anti-enumeration)", async () => {
    mockFetchOnce({ error: { code: "unknown_error", errors: [] } }, false, 404);
    await expect(sendPasswordResetCode("a@b.com")).resolves.toEqual({ ok: true });
  });

  it("maps a thrown fetch to a network_error payload", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("offline"));
    const result = await sendPasswordResetCode("a@b.com");
    expect(result).toEqual({ ok: false, error: { code: "network_error", errors: [] } });
  });
});

describe("checkPasswordResetCode", () => {
  it("returns ok with valid true on success", async () => {
    mockFetchOnce({ data: { valid: true } });
    await expect(checkPasswordResetCode("a@b.com", "123456")).resolves.toEqual({
      ok: true,
      valid: true,
    });
  });

  it("returns ok with valid false when the code is invalid", async () => {
    mockFetchOnce({ data: { valid: false } });
    await expect(checkPasswordResetCode("a@b.com", "000000")).resolves.toEqual({
      ok: true,
      valid: false,
    });
  });

  it("surfaces the structured error payload on a non-OK response", async () => {
    mockFetchOnce({ error: { code: "unknown_error", errors: [] } }, false, 400);
    const result = await checkPasswordResetCode("a@b.com", "000000");
    expect(result).toEqual({ ok: false, error: { code: "unknown_error", errors: [] } });
  });

  it("maps a thrown fetch to a network_error payload", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("offline"));
    const result = await checkPasswordResetCode("a@b.com", "123456");
    expect(result).toEqual({ ok: false, error: { code: "network_error", errors: [] } });
  });
});

describe("resetPasswordWithCode", () => {
  it("returns ok with a token on success", async () => {
    mockFetchOnce({ data: { token: "tok" } });
    await expect(resetPasswordWithCode("a@b.com", "123456", "newpw")).resolves.toEqual({
      ok: true,
      token: "tok",
    });
  });

  it("surfaces the structured error payload on a non-OK response", async () => {
    mockFetchOnce({ error: { code: "invalid_code", errors: [] } }, false, 400);
    const result = await resetPasswordWithCode("a@b.com", "000000", "newpw");
    expect(result).toEqual({ ok: false, error: { code: "invalid_code", errors: [] } });
  });

  it("maps a thrown fetch to a network_error payload", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("offline"));
    const result = await resetPasswordWithCode("a@b.com", "123456", "newpw");
    expect(result).toEqual({ ok: false, error: { code: "network_error", errors: [] } });
  });

  it("returns unknown_error when an OK response lacks a token", async () => {
    mockFetchOnce({ data: {} });
    const result = await resetPasswordWithCode("a@b.com", "123456", "newpw");
    expect(result).toEqual({ ok: false, error: { code: "unknown_error", errors: [] } });
  });
});

describe("sendEmailChangeCode", () => {
  it("returns ok on success", async () => {
    mockFetchOnce({});
    await expect(sendEmailChangeCode("session-tok", "new@b.com", "pw")).resolves.toEqual({
      ok: true,
    });
  });

  it("includes the session token as a bearer Authorization header", async () => {
    mockFetchOnce({});
    await sendEmailChangeCode("session-tok", "new@b.com", "pw");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer session-tok");
    expect(JSON.parse(init.body)).toEqual({ newEmail: "new@b.com", password: "pw" });
  });

  it("surfaces the structured error payload on a non-OK response", async () => {
    mockFetchOnce({ error: { code: "invalid_login", errors: [] } }, false, 401);
    const result = await sendEmailChangeCode("session-tok", "new@b.com", "wrong");
    expect(result).toEqual({ ok: false, error: { code: "invalid_login", errors: [] } });
  });

  it("maps a thrown fetch to a network_error payload", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("offline"));
    const result = await sendEmailChangeCode("session-tok", "new@b.com", "pw");
    expect(result).toEqual({ ok: false, error: { code: "network_error", errors: [] } });
  });
});

describe("changeEmailWithCode", () => {
  it("returns ok with a token on success", async () => {
    mockFetchOnce({ data: { token: "tok" } });
    await expect(changeEmailWithCode("a@b.com", "123456")).resolves.toEqual({
      ok: true,
      token: "tok",
    });
  });

  it("surfaces the structured error payload on a non-OK response", async () => {
    mockFetchOnce({ error: { code: "invalid_code", errors: [] } }, false, 400);
    const result = await changeEmailWithCode("a@b.com", "000000");
    expect(result).toEqual({ ok: false, error: { code: "invalid_code", errors: [] } });
  });

  it("maps a thrown fetch to a network_error payload", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("offline"));
    const result = await changeEmailWithCode("a@b.com", "123456");
    expect(result).toEqual({ ok: false, error: { code: "network_error", errors: [] } });
  });

  it("returns unknown_error when an OK response lacks a token", async () => {
    mockFetchOnce({ data: {} });
    const result = await changeEmailWithCode("a@b.com", "123456");
    expect(result).toEqual({ ok: false, error: { code: "unknown_error", errors: [] } });
  });
});
