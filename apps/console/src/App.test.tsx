import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import {
  buildKnowledgeNetwork,
  createKnowledgeNetwork,
  getKnowledgeNetwork,
  listKnowledgeNetworks,
} from "./knowledgeApi";

vi.mock("./knowledgeApi", () => ({
  listKnowledgeNetworks: vi.fn(),
  getKnowledgeNetwork: vi.fn(),
  createKnowledgeNetwork: vi.fn(),
  buildKnowledgeNetwork: vi.fn(),
}));

const network = {
  id: "kn-1",
  name: "集团经营网络",
  description: "统一收入、成本和风险口径",
  tags: ["经营", "集团"],
  statistics: null,
};

describe("App", () => {
  beforeEach(() => {
    vi.mocked(listKnowledgeNetworks).mockReset();
    vi.mocked(getKnowledgeNetwork).mockReset();
    vi.mocked(createKnowledgeNetwork).mockReset();
    vi.mocked(buildKnowledgeNetwork).mockReset();
    vi.mocked(listKnowledgeNetworks).mockResolvedValue({
      items: [network],
      offset: 0,
      limit: 50,
    });
  });

  it("opens on the real KWeaver knowledge-network task", async () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "把经营数据组织成可查询的业务语义" }),
    ).toBeVisible();
    expect(await screen.findByText("集团经营网络")).toBeVisible();
    expect(screen.getByRole("button", { name: "创建知识网络" })).toBeEnabled();
    expect(screen.queryByText("运行状态")).not.toBeInTheDocument();
    expect(screen.queryByText("方案比较")).not.toBeInTheDocument();
  });

  it("searches with the user-entered network name", async () => {
    render(<App />);
    await screen.findByText("集团经营网络");

    fireEvent.change(screen.getByLabelText("按名称搜索知识网络"), {
      target: { value: "供应链" },
    });
    fireEvent.click(screen.getByRole("button", { name: "查询" }));

    await waitFor(() =>
      expect(listKnowledgeNetworks).toHaveBeenLastCalledWith(
        "供应链",
        undefined,
      ),
    );
  });

  it("validates and creates a knowledge network before refreshing", async () => {
    vi.mocked(createKnowledgeNetwork).mockResolvedValue({
      ...network,
      id: "kn-new",
      name: "供应链风险网络",
    });
    render(<App />);
    await screen.findByText("集团经营网络");

    fireEvent.click(screen.getByRole("button", { name: "创建知识网络" }));
    const dialog = screen.getByRole("dialog", { name: "创建业务知识网络" });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "创建知识网络" }),
    );
    expect(screen.getByText("请填写知识网络名称。")).toBeVisible();

    fireEvent.change(screen.getByLabelText("知识网络名称"), {
      target: { value: "供应链风险网络" },
    });
    fireEvent.change(screen.getByLabelText("知识网络说明"), {
      target: { value: "识别供应与交付风险" },
    });
    fireEvent.change(screen.getByLabelText("知识网络标签"), {
      target: { value: "风险，供应链,风险" },
    });
    const createForm = screen.getByLabelText("知识网络名称").closest("form");
    expect(createForm).not.toBeNull();
    if (createForm) fireEvent.submit(createForm);

    await waitFor(() =>
      expect(createKnowledgeNetwork).toHaveBeenCalledWith({
        name: "供应链风险网络",
        description: "识别供应与交付风险",
        tags: ["风险", "供应链"],
      }),
    );
    expect(await screen.findByText(/已创建“供应链风险网络”/)).toBeVisible();
    expect(listKnowledgeNetworks).toHaveBeenCalledTimes(2);
  });

  it("loads detail and submits a confirmed full build", async () => {
    vi.mocked(getKnowledgeNetwork).mockResolvedValue({
      ...network,
      statistics: {
        object_types: 3,
        relation_types: 2,
        action_types: 1,
        concept_groups: 4,
      },
    });
    vi.mocked(buildKnowledgeNetwork).mockResolvedValue({
      knowledge_network_id: "kn-1",
      state: "accepted",
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);
    await screen.findByText("集团经营网络");

    fireEvent.click(screen.getByRole("button", { name: "查看详情" }));
    expect(await screen.findByText("对象类型")).toBeVisible();
    expect(screen.getByText("3")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "触发全量构建" }));

    await waitFor(() =>
      expect(buildKnowledgeNetwork).toHaveBeenCalledWith("kn-1"),
    );
    expect(await screen.findByText(/全量构建任务已提交/)).toBeVisible();
  });

  it("shows an actionable empty integration error and retries", async () => {
    const unavailable = Object.assign(new Error("not configured"), {
      code: "KWEAVER_NOT_CONFIGURED",
    });
    vi.mocked(listKnowledgeNetworks)
      .mockRejectedValueOnce(unavailable)
      .mockResolvedValueOnce({ items: [], offset: 0, limit: 50 });
    render(<App />);

    expect(
      await screen.findByText(
        "当前环境尚未连接 KWeaver，暂时不能读取知识网络。",
      ),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(await screen.findByText("还没有知识网络")).toBeVisible();
  });
});
