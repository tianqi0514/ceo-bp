import { afterEach, describe, expect, it, vi } from "vitest";
import { loadOverview } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadOverview", () => {
  it("returns the typed overview payload", async () => {
    const payload = {
      info: {
        product: "CEO-BP",
        service: "platform-api",
        version: "0.3.0",
        environment: "test",
        build_sha: "abc123",
      },
      health: { status: "ready", service: "platform-api", version: "0.3.0" },
      capabilities: [],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(payload),
      }),
    );

    await expect(loadOverview()).resolves.toEqual(payload);
    expect(fetch).toHaveBeenCalledWith("/api/v1/overview", {
      headers: { Accept: "application/json" },
      signal: undefined,
    });
  });

  it("throws a useful error for non-success responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );

    await expect(loadOverview()).rejects.toThrow("平台状态请求失败（503）");
  });
});
