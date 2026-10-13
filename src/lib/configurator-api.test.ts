// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { configuratorApi, ConfiguratorApiError, isConfiguratorPreview, getCatalogueRows } from "./configurator-api";

describe("private Go-Pods API transport", () => {
  beforeEach(() => {
    vi.stubEnv("CONFIGURATOR_API_URL", "https://api.example.com");
    vi.stubEnv("CONFIGURATOR_API_TOKEN", "private-test-token");
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  it("sends private authorization, disables caching and refuses redirects", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ data: { reference: "GP-TEST" } }));
    expect(await configuratorApi("submissions", { method: "POST", body: "{}", headers: { "Idempotency-Key": "stable-id" } })).toEqual({ reference: "GP-TEST" });
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toBe("https://api.example.com/api/v1/configurator/submissions");
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer private-test-token");
    expect(headers.get("Idempotency-Key")).toBe("stable-id");
    expect(init).toMatchObject({ cache: "no-store", redirect: "error" });
  });
  it("preserves the existing API field-validation envelope", async () => {
    const fields = { "customerDetails.email": ["Please enter a valid email."] };
    vi.mocked(fetch).mockResolvedValue(Response.json({ error: { code: "validation_failed", message: "Invalid submission", fields } }, { status: 422 }));
    await expect(configuratorApi("submissions", { method: "POST", body: "{}" })).rejects.toMatchObject({ status: 422, errors: fields });
  });
  it("requires explicit preview and rejects partial credentials", () => {
    vi.stubEnv("CONFIGURATOR_API_URL", ""); vi.stubEnv("CONFIGURATOR_API_TOKEN", "");
    expect(() => isConfiguratorPreview()).toThrow();
    vi.stubEnv("CONFIGURATOR_PREVIEW", "true"); expect(isConfiguratorPreview()).toBe(true);
    vi.stubEnv("CONFIGURATOR_API_TOKEN", "private"); expect(() => isConfiguratorPreview()).toThrow();
  });
  it("never turns live API errors into demonstration data", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ error: "down" }, { status: 503 }));
    await expect(getCatalogueRows()).rejects.toBeInstanceOf(ConfiguratorApiError);
  });
  it("rejects incomplete catalogue responses", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ data: { models: [] } }));
    await expect(getCatalogueRows()).rejects.toThrow("Missing catalogue table");
  });
  it("does not send credentials over public plain HTTP", async () => {
    vi.stubEnv("CONFIGURATOR_API_URL", "http://api.example.com");
    await expect(configuratorApi("catalogue")).rejects.toThrow("requires HTTPS");
    expect(fetch).not.toHaveBeenCalled();
  });
});
