import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeDecision, type DecisionAnalysisRequest } from "./api";

const request: DecisionAnalysisRequest = {
  title: "选择区域市场",
  objective: "比较增长与成本",
  criteria: [
    { id: "growth", name: "增长", weight: 60, direction: "benefit" },
    { id: "cost", name: "成本", weight: 40, direction: "cost" },
  ],
  options: [
    { id: "a", name: "方案 A", scores: { growth: 80, cost: 70 } },
    { id: "b", name: "方案 B", scores: { growth: 60, cost: 20 } },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("analyzeDecision", () => {
  it("posts the decision matrix and returns the typed analysis", async () => {
    const payload = {
      title: request.title,
      recommended_option_id: "b",
      ranking: [],
      score_gap: 8,
      stability: "stable",
      sensitive_criteria: [],
      warnings: [],
      methodology: "weighted score",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(payload),
      }),
    );

    await expect(analyzeDecision(request)).resolves.toEqual(payload);
    expect(fetch).toHaveBeenCalledWith("/api/v1/decisions/analyze", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: undefined,
    });
  });

  it("explains validation failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 422 }),
    );

    await expect(analyzeDecision(request)).rejects.toThrow(
      "输入内容未通过校验",
    );
  });

  it("explains service failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );

    await expect(analyzeDecision(request)).rejects.toThrow(
      "分析服务暂时不可用（503）",
    );
  });
});
