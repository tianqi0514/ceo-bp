import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  buildKnowledgeNetwork,
  createKnowledgeNetwork,
  createObjectType,
  getKnowledgeNetwork,
  listKnowledgeNetworks,
  listObjectTypes,
} from "./knowledgeApi";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("knowledge API", () => {
  it("lists knowledge networks with an encoded business search", async () => {
    const payload = { items: [], offset: 0, limit: 50 };
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: () => Promise.resolve(payload) }),
    );

    await expect(listKnowledgeNetworks("  供应链 风险  ")).resolves.toEqual(
      payload,
    );

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/knowledge-networks?offset=0&limit=50&name_pattern=%E4%BE%9B%E5%BA%94%E9%93%BE+%E9%A3%8E%E9%99%A9",
      expect.objectContaining({ signal: undefined }),
    );
  });

  it("gets a detail and safely encodes its identifier", async () => {
    const payload = { id: "kn/a", name: "网络", tags: [] };
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: () => Promise.resolve(payload) }),
    );

    await expect(getKnowledgeNetwork("kn/a")).resolves.toEqual(payload);
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/knowledge-networks/kn%2Fa",
      expect.objectContaining({ signal: undefined }),
    );
  });

  it("creates a network and triggers its build with explicit methods", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "kn-1", name: "经营网络" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ knowledge_network_id: "kn-1", state: "accepted" }),
      });
    vi.stubGlobal("fetch", fetchMock);
    const input = { name: "经营网络", description: "经营口径", tags: ["经营"] };

    await createKnowledgeNetwork(input);
    await buildKnowledgeNetwork("kn-1");

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/v1/knowledge-networks", {
      method: "POST",
      body: JSON.stringify(input),
      signal: undefined,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/v1/knowledge-networks/kn-1/builds",
      {
        method: "POST",
        signal: undefined,
        headers: { Accept: "application/json" },
      },
    );
  });

  it("preserves stable API errors and handles non-JSON proxy errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: () =>
            Promise.resolve({
              error: {
                code: "KWEAVER_UNAVAILABLE",
                message: "KWeaver 暂时不可用",
                retryable: true,
              },
            }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 502,
          json: () => Promise.reject(new Error("not json")),
        }),
    );

    const first = await listKnowledgeNetworks().catch(
      (error: unknown) => error,
    );
    expect(first).toBeInstanceOf(ApiError);
    expect(first).toMatchObject({
      code: "KWEAVER_UNAVAILABLE",
      status: 503,
      retryable: true,
    });
    await expect(listKnowledgeNetworks()).rejects.toThrow("请求失败（502）");
  });

  it("lists and creates object types inside the selected knowledge network", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "ot-1", name: "客户" }),
      });
    vi.stubGlobal("fetch", fetchMock);
    const input = {
      name: "客户",
      primary_key: "customer_id",
      display_key: "customer_name",
      fields: [
        {
          name: "customer_id",
          display_name: "客户编号",
          type: "string" as const,
        },
        {
          name: "customer_name",
          display_name: "客户名称",
          type: "string" as const,
        },
      ],
    };

    await listObjectTypes("kn/1");
    await createObjectType("kn/1", input);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/v1/knowledge-networks/kn%2F1/object-types",
      expect.objectContaining({ signal: undefined }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/v1/knowledge-networks/kn%2F1/object-types",
      {
        method: "POST",
        body: JSON.stringify(input),
        signal: undefined,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );
  });
});
