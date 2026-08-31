import {
  classifyAuthUserResponse,
  isApiAnswer,
  probeStoredToken,
  type TokenValidation,
} from "./tokenValidation";

const unauthenticatedBody = { error: { code: "unauthenticated", errors: [] } };

describe("classifyAuthUserResponse", () => {
  // `GET /auth/user` authenticates optionally, so a dead token comes back as a
  // 200 with a null user rather than a 401.
  it("treats a 200 with a null user as an authoritative rejection", () => {
    expect(classifyAuthUserResponse(200, { data: { user: null } })).toEqual({ result: "invalid" });
  });

  it("treats a 200 carrying a user as valid", () => {
    expect(classifyAuthUserResponse(200, { data: { user: { email: "a@b.com" } } })).toEqual({
      result: "valid",
    });
  });

  it("treats our own 401 envelope as an authoritative rejection", () => {
    expect(classifyAuthUserResponse(401, unauthenticatedBody)).toEqual({ result: "invalid" });
  });

  // Everything below must NOT log the user out.
  const indeterminate: [string, number, unknown, string][] = [
    [
      "a 500 (API up, database down)",
      500,
      { error: { code: "internal_server_error" } },
      "server_error",
    ],
    ["a 502 from a proxy", 502, undefined, "server_error"],
    ["a 503 maintenance page", 503, "<html>maintenance</html>", "server_error"],
    ["a 504 gateway timeout", 504, undefined, "server_error"],
    ["a 404 from a wrong base URL", 404, { error: { code: "not_found" } }, "not_found"],
    ["a 408 request timeout", 408, undefined, "timeout"],
    ["a 429 rate limit", 429, { error: { code: "too_many_requests" } }, "rate_limited"],
    ["a 403 from a WAF", 403, undefined, "bad_response"],
    ["a 400", 400, { error: { code: "invalid_request" } }, "bad_response"],
    ["a 301 redirect", 301, undefined, "bad_response"],
    ["a bare 401 with no envelope of ours", 401, undefined, "bad_response"],
    ["a 401 HTML page from a proxy", 401, "<html>Proxy Authentication</html>", "bad_response"],
    ["a captive-portal 200", 200, "<html>Sign in to WiFi</html>", "bad_response"],
    ["a 200 whose body failed to parse", 200, undefined, "bad_response"],
    ["a 200 with no user key at all", 200, { data: {} }, "bad_response"],
    ["a 200 with a non-object user", 200, { data: { user: "nope" } }, "bad_response"],
  ];

  it.each(indeterminate)("leaves the session alone for %s", (_label, status, body, reason) => {
    expect(classifyAuthUserResponse(status, body)).toEqual({ result: "indeterminate", reason });
  });
});

describe("isApiAnswer", () => {
  const cases: [TokenValidation, boolean][] = [
    [{ result: "valid" }, true],
    [{ result: "invalid" }, true],
    [{ result: "indeterminate", reason: "rate_limited" }, true],
    [{ result: "indeterminate", reason: "server_error" }, false],
    [{ result: "indeterminate", reason: "transport" }, false],
    [{ result: "indeterminate", reason: "timeout" }, false],
    [{ result: "indeterminate", reason: "not_found" }, false],
    [{ result: "indeterminate", reason: "bad_response" }, false],
  ];

  it.each(cases)("%p -> %p", (validation, expected) => {
    expect(isApiAnswer(validation)).toBe(expected);
  });
});

describe("probeStoredToken", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("sends the bearer token to /auth/user", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      json: async () => ({ data: { user: { email: "a@b.com" } } }),
    });

    await expect(probeStoredToken("tok")).resolves.toEqual({ result: "valid" });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://localhost:8080/api/auth/user");
    expect(init.headers.Authorization).toBe("Bearer tok");
  });

  it("reports a rejected fetch as a transport failure", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError("Network request failed"));
    await expect(probeStoredToken("tok")).resolves.toEqual({
      result: "indeterminate",
      reason: "transport",
    });
  });

  it("reports an aborted request as a timeout", async () => {
    const abort = Object.assign(new Error("Aborted"), { name: "AbortError" });
    (global.fetch as jest.Mock).mockRejectedValueOnce(abort);
    await expect(probeStoredToken("tok")).resolves.toEqual({
      result: "indeterminate",
      reason: "timeout",
    });
  });

  it("does not throw when the body isn't JSON", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token <");
      },
    });
    await expect(probeStoredToken("tok")).resolves.toEqual({
      result: "indeterminate",
      reason: "bad_response",
    });
  });
});
