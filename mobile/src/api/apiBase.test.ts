import { getApiBaseUrl, getApiOrigin } from "./apiBase";

// `expo-constants` is mocked in jest.setup.ts to report apiBaseUrl
// "http://localhost:8080".
describe("apiBase", () => {
  it("getApiBaseUrl appends /api to a bare origin", () => {
    expect(getApiBaseUrl()).toBe("http://localhost:8080/api");
  });

  it("getApiOrigin returns the origin without /api", () => {
    expect(getApiOrigin()).toBe("http://localhost:8080");
  });
});
