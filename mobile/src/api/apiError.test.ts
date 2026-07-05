import { ApiError, mapFormErrors, parseApiErrorBody, type ApiErrorPayload } from "./apiError";

describe("parseApiErrorBody", () => {
  it("extracts code and field-level details", () => {
    const payload = parseApiErrorBody({
      error: {
        code: "validation_error",
        errors: [
          { field: "email", code: "required" },
          { field: "password", code: "min_length", properties: { minlength: 8 } },
        ],
      },
    });
    expect(payload.code).toBe("validation_error");
    expect(payload.errors).toHaveLength(2);
    expect(payload.errors[1]).toEqual({
      field: "password",
      code: "min_length",
      properties: { minlength: 8 },
    });
  });

  it("treats a null field as a top-level error", () => {
    const payload = parseApiErrorBody({
      error: { code: "invalid_login", errors: [{ field: null, code: "invalid_login" }] },
    });
    expect(payload.errors[0].field).toBeNull();
  });

  it("drops malformed detail entries (no string code)", () => {
    const payload = parseApiErrorBody({
      error: { code: "x", errors: [{ field: "a" }, null, 5, { code: "ok" }] },
    });
    expect(payload.errors).toEqual([{ field: null, code: "ok", properties: undefined }]);
  });

  it("falls back to unknown_error for an unrecognized body", () => {
    expect(parseApiErrorBody(undefined)).toEqual({ code: "unknown_error", errors: [] });
    expect(parseApiErrorBody({ nope: true })).toEqual({ code: "unknown_error", errors: [] });
    expect(parseApiErrorBody({ error: {} })).toEqual({ code: "unknown_error", errors: [] });
  });
});

describe("ApiError", () => {
  it("exposes code and errors and is an Error instance", () => {
    const err = new ApiError({ code: "invalid_login", errors: [] });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ApiError");
    expect(err.code).toBe("invalid_login");
    expect(err.message).toBe("invalid_login");
  });

  it("defaults errors to an empty array", () => {
    const err = new ApiError({ code: "x" } as ApiErrorPayload);
    expect(err.errors).toEqual([]);
  });
});

describe("mapFormErrors", () => {
  it("keys field errors by field name", () => {
    const map = mapFormErrors({
      code: "validation_error",
      errors: [
        { field: "email", code: "required" },
        { field: null, code: "review" },
      ],
    });
    expect(map.email.code).toBe("required");
    expect(map._form.code).toBe("review");
  });

  it("synthesizes a _form error from the payload code when no details exist", () => {
    const map = mapFormErrors({ code: "invalid_login", errors: [] });
    expect(map._form).toEqual({ field: null, code: "invalid_login" });
  });
});
