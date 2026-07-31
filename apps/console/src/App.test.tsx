import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { analyzeDecision, type DecisionAnalysis } from "./api";

vi.mock("./api", () => ({ analyzeDecision: vi.fn() }));

const analysis: DecisionAnalysis = {
  title: "选择区域市场",
  recommended_option_id: "option-2",
  ranking: [
    {
      option_id: "option-2",
      option_name: "方案 B",
      rank: 1,
      score: 68,
      weaknesses: [],
      contributions: [
        {
          criterion_id: "criterion-1",
          criterion_name: "增长潜力",
          raw_score: 60,
          adjusted_score: 60,
          weighted_points: 36,
        },
        {
          criterion_id: "criterion-2",
          criterion_name: "进入成本",
          raw_score: 20,
          adjusted_score: 80,
          weighted_points: 32,
        },
      ],
    },
    {
      option_id: "option-1",
      option_name: "方案 A",
      rank: 2,
      score: 60,
      weaknesses: ["进入成本"],
      contributions: [
        {
          criterion_id: "criterion-1",
          criterion_name: "增长潜力",
          raw_score: 80,
          adjusted_score: 80,
          weighted_points: 48,
        },
        {
          criterion_id: "criterion-2",
          criterion_name: "进入成本",
          raw_score: 70,
          adjusted_score: 30,
          weighted_points: 12,
        },
      ],
    },
  ],
  score_gap: 8,
  stability: "stable",
  sensitive_criteria: [],
  warnings: ["结果来自用户输入。"],
  methodology: "归一化加权评分。",
};

function fillValidDecision() {
  fireEvent.change(screen.getByLabelText("决策标题"), {
    target: { value: "选择区域市场" },
  });
  fireEvent.change(screen.getByLabelText("决策目标"), {
    target: { value: "比较增长空间和进入成本" },
  });
  fireEvent.change(screen.getByLabelText("评价维度 1 名称"), {
    target: { value: "增长潜力" },
  });
  fireEvent.change(screen.getByLabelText("评价维度 1 权重"), {
    target: { value: "60" },
  });
  fireEvent.change(screen.getByLabelText("评价维度 2 名称"), {
    target: { value: "进入成本" },
  });
  fireEvent.change(screen.getByLabelText("评价维度 2 权重"), {
    target: { value: "40" },
  });
  fireEvent.change(screen.getByLabelText("评价维度 2 评分方向"), {
    target: { value: "cost" },
  });
  fireEvent.change(screen.getByLabelText("方案 1 名称"), {
    target: { value: "方案 A" },
  });
  fireEvent.change(screen.getByLabelText("方案 2 名称"), {
    target: { value: "方案 B" },
  });
  fireEvent.change(screen.getByLabelText("方案 1 在评价维度 1 的评分"), {
    target: { value: "80" },
  });
  fireEvent.change(screen.getByLabelText("方案 1 在评价维度 2 的评分"), {
    target: { value: "70" },
  });
  fireEvent.change(screen.getByLabelText("方案 2 在评价维度 1 的评分"), {
    target: { value: "60" },
  });
  fireEvent.change(screen.getByLabelText("方案 2 在评价维度 2 的评分"), {
    target: { value: "20" },
  });
}

describe("App", () => {
  beforeEach(() => {
    vi.mocked(analyzeDecision).mockReset();
  });

  it("opens on a user decision task instead of system status", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "建立一份可复核的决策分析" }),
    ).toBeVisible();
    expect(screen.getByLabelText("决策标题")).toBeVisible();
    expect(screen.getByRole("button", { name: "开始分析" })).toBeEnabled();
    expect(screen.queryByText("运行状态")).not.toBeInTheDocument();
    expect(screen.queryByText("API 文档")).not.toBeInTheDocument();
  });

  it("validates required decision fields before sending", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "开始分析" }));

    expect(screen.getByText("请填写至少 3 个字的决策标题。")).toBeVisible();
    expect(analyzeDecision).not.toHaveBeenCalled();
  });

  it("validates every stage of an incomplete matrix", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("决策标题"), {
      target: { value: "区域选择" },
    });
    fireEvent.click(screen.getByRole("button", { name: "开始分析" }));
    expect(screen.getByText("请填写所有评价维度的名称。")).toBeVisible();

    fireEvent.change(screen.getByLabelText("评价维度 1 名称"), {
      target: { value: "收益" },
    });
    fireEvent.change(screen.getByLabelText("评价维度 2 名称"), {
      target: { value: "收益" },
    });
    fireEvent.click(screen.getByRole("button", { name: "重新分析" }));
    expect(screen.getByText("评价维度名称不能重复。")).toBeVisible();

    fireEvent.change(screen.getByLabelText("评价维度 2 名称"), {
      target: { value: "风险" },
    });
    fireEvent.click(screen.getByRole("button", { name: "重新分析" }));
    expect(
      screen.getByText("每个评价维度都需要填写大于 0 的权重。"),
    ).toBeVisible();

    fireEvent.change(screen.getByLabelText("评价维度 1 权重"), {
      target: { value: "50" },
    });
    fireEvent.change(screen.getByLabelText("评价维度 2 权重"), {
      target: { value: "50" },
    });
    fireEvent.click(screen.getByRole("button", { name: "重新分析" }));
    expect(screen.getByText("请填写所有备选方案的名称。")).toBeVisible();

    fireEvent.change(screen.getByLabelText("方案 1 名称"), {
      target: { value: "方案" },
    });
    fireEvent.change(screen.getByLabelText("方案 2 名称"), {
      target: { value: "方案" },
    });
    fireEvent.click(screen.getByRole("button", { name: "重新分析" }));
    expect(screen.getByText("备选方案名称不能重复。")).toBeVisible();

    fireEvent.change(screen.getByLabelText("方案 2 名称"), {
      target: { value: "备选" },
    });
    fireEvent.click(screen.getByRole("button", { name: "重新分析" }));
    expect(
      screen.getByText("请为每个方案填写 0 到 100 之间的完整评分。"),
    ).toBeVisible();
  });

  it("adds and removes real criteria and option inputs", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "添加维度" }));
    expect(screen.getByLabelText("评价维度 3 名称")).toBeVisible();
    expect(
      screen.getAllByRole("button", { name: /删除评价维度/ }),
    ).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "删除评价维度 3" }));
    expect(screen.queryByLabelText("评价维度 3 名称")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "添加方案" }));
    expect(screen.getByLabelText("方案 3 名称")).toBeVisible();
    expect(screen.getAllByRole("button", { name: /删除方案/ })).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "删除方案 3" }));
    expect(screen.queryByLabelText("方案 3 名称")).not.toBeInTheDocument();
  });

  it("shows clear limits after adding the maximum inputs", () => {
    render(<App />);

    for (let index = 0; index < 6; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: "添加维度" }));
    }
    expect(screen.getByText("已达到 8 个维度上限")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "添加维度" }),
    ).not.toBeInTheDocument();

    for (let index = 0; index < 4; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: "添加方案" }));
    }
    expect(screen.getByText("已达到 6 个方案上限")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "添加方案" }),
    ).not.toBeInTheDocument();
  });

  it("submits user inputs and renders an auditable ranking", async () => {
    vi.mocked(analyzeDecision).mockResolvedValue(analysis);
    render(<App />);
    fillValidDecision();

    expect(
      screen.getByRole("status", { name: "当前权重合计 100%" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "开始分析" }));

    await waitFor(() => expect(analyzeDecision).toHaveBeenCalledTimes(1));
    expect(analyzeDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "选择区域市场",
        objective: "比较增长空间和进入成本",
        criteria: expect.arrayContaining([
          expect.objectContaining({
            name: "进入成本",
            direction: "cost",
            weight: 40,
          }),
        ]),
      }),
    );
    expect(
      await screen.findByRole("heading", { name: "建议优先考虑 方案 B" }),
    ).toBeVisible();
    expect(screen.getByText("排序相对稳定")).toBeVisible();
    expect(screen.getByText("需重点核查：进入成本")).toBeVisible();
    expect(screen.getByText("未发现高权重低分项")).toBeVisible();
    expect(
      screen.getByText("各维度权重上下浮动 20% 时，首选方案没有变化。"),
    ).toBeVisible();
    expect(screen.getAllByText("查看计算明细")).toHaveLength(2);
  });

  it("renders sensitivity findings when the recommendation is fragile", async () => {
    vi.mocked(analyzeDecision).mockResolvedValue({
      ...analysis,
      stability: "sensitive",
      sensitive_criteria: ["增长潜力"],
    });
    render(<App />);
    fillValidDecision();
    fireEvent.click(screen.getByRole("button", { name: "开始分析" }));

    expect(await screen.findByText("排序对权重敏感")).toBeVisible();
    expect(
      screen.getByText("敏感维度：增长潜力。建议复核这些权重。"),
    ).toBeVisible();
  });

  it("keeps the user's inputs and offers a meaningful retry after failure", async () => {
    vi.mocked(analyzeDecision).mockRejectedValueOnce(new Error("服务连接失败"));
    render(<App />);
    fillValidDecision();
    fireEvent.click(screen.getByRole("button", { name: "开始分析" }));

    expect(await screen.findByText("服务连接失败")).toBeVisible();
    expect(screen.getByLabelText("决策标题")).toHaveValue("选择区域市场");
    expect(screen.getByRole("button", { name: "重新分析" })).toBeEnabled();
  });

  it("shows an execution state while analysis is running", async () => {
    vi.mocked(analyzeDecision).mockReturnValue(new Promise(() => undefined));
    render(<App />);
    fillValidDecision();
    fireEvent.click(screen.getByRole("button", { name: "开始分析" }));

    expect(
      await screen.findByRole("button", { name: "正在分析" }),
    ).toBeDisabled();
  });
});
