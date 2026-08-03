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
  createKnowledgeNetwork,
  createObjectType,
  getKnowledgeNetwork,
  listKnowledgeNetworks,
  listObjectTypes,
} from "./knowledgeApi";

vi.mock("./knowledgeApi", () => ({
  listKnowledgeNetworks: vi.fn(),
  getKnowledgeNetwork: vi.fn(),
  createKnowledgeNetwork: vi.fn(),
  buildKnowledgeNetwork: vi.fn(),
  listObjectTypes: vi.fn(),
  createObjectType: vi.fn(),
}));

const network = {
  id: "kn-1",
  name: "集团经营网络",
  description: "统一收入、成本和风险口径",
  tags: ["经营", "集团"],
  statistics: null,
};

const customerObject = {
  id: "ot-customer",
  knowledge_network_id: "kn-1",
  name: "客户",
  primary_keys: ["customer_id"],
  display_key: "customer_name",
  fields: [
    { name: "customer_id", display_name: "客户编号", type: "string" as const },
    {
      name: "customer_name",
      display_name: "客户名称",
      type: "string" as const,
    },
  ],
};

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(listKnowledgeNetworks).mockReset();
    vi.mocked(getKnowledgeNetwork).mockReset();
    vi.mocked(createKnowledgeNetwork).mockReset();
    vi.mocked(listObjectTypes).mockReset();
    vi.mocked(createObjectType).mockReset();
    vi.mocked(listKnowledgeNetworks).mockResolvedValue({
      items: [network],
      offset: 0,
      limit: 50,
    });
    vi.mocked(listObjectTypes).mockResolvedValue({ items: [] });
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

  it("loads detail and shows the real object schema", async () => {
    vi.mocked(getKnowledgeNetwork).mockResolvedValue({
      ...network,
      statistics: {
        object_types: 3,
        relation_types: 2,
        action_types: 1,
        concept_groups: 4,
      },
    });
    vi.mocked(listObjectTypes).mockResolvedValue({ items: [customerObject] });
    render(<App />);
    await screen.findByText("集团经营网络");

    fireEvent.click(screen.getByRole("button", { name: "查看详情" }));
    expect(await screen.findByText("对象类型")).toBeVisible();
    expect(screen.getByText("3")).toBeVisible();
    expect(screen.getByRole("heading", { name: "经营对象" })).toBeVisible();
    expect(screen.getByText("客户编号")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "触发全量构建" }),
    ).not.toBeInTheDocument();
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

  it("refreshes the list and closes focused workflows", async () => {
    vi.mocked(getKnowledgeNetwork).mockResolvedValue(network);
    render(<App />);
    await screen.findByText("集团经营网络");

    fireEvent.click(screen.getByRole("button", { name: "刷新知识网络列表" }));
    await waitFor(() => expect(listKnowledgeNetworks).toHaveBeenCalledTimes(2));

    fireEvent.click(screen.getByRole("button", { name: "创建知识网络" }));
    fireEvent.click(screen.getByRole("button", { name: "关闭创建窗口" }));
    expect(
      screen.queryByRole("dialog", { name: "创建业务知识网络" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "创建知识网络" }));
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(
      screen.queryByRole("dialog", { name: "创建业务知识网络" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "查看详情" }));
    expect(
      await screen.findByRole("dialog", { name: "集团经营网络" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "触发全量构建" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "返回知识网络列表" }));
    expect(
      screen.queryByRole("dialog", { name: "集团经营网络" }),
    ).not.toBeInTheDocument();
  });

  it("keeps create errors in the form", async () => {
    vi.mocked(createKnowledgeNetwork).mockRejectedValue(
      new Error("知识网络名称已存在。"),
    );
    vi.mocked(getKnowledgeNetwork).mockResolvedValue({
      ...network,
      statistics: {
        object_types: 1,
        relation_types: 0,
        action_types: 0,
        concept_groups: 0,
      },
    });
    render(<App />);
    await screen.findByText("集团经营网络");

    fireEvent.click(screen.getByRole("button", { name: "创建知识网络" }));
    fireEvent.change(screen.getByLabelText("知识网络名称"), {
      target: { value: "集团经营网络" },
    });
    const createForm = screen.getByLabelText("知识网络名称").closest("form");
    expect(createForm).not.toBeNull();
    if (createForm) fireEvent.submit(createForm);
    expect(await screen.findByText("知识网络名称已存在。")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "取消" }));

    fireEvent.click(screen.getByRole("button", { name: "查看详情" }));
    expect(
      await screen.findByRole("dialog", { name: "集团经营网络" }),
    ).toBeVisible();
  });

  it("uses a safe message for an unknown request failure", async () => {
    vi.mocked(listKnowledgeNetworks).mockRejectedValue("network failed");
    render(<App />);

    expect(
      await screen.findByText("知识网络请求失败，请稍后重试。"),
    ).toBeVisible();
  });

  it("creates a meaningful object type with declared keys and fields", async () => {
    vi.mocked(getKnowledgeNetwork).mockResolvedValue(network);
    vi.mocked(createObjectType).mockResolvedValue(customerObject);
    render(<App />);
    await screen.findByText("集团经营网络");

    fireEvent.click(screen.getByRole("button", { name: "查看详情" }));
    expect(
      await screen.findByRole("button", { name: "新增对象类型" }),
    ).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "新增对象类型" }));

    const dialog = screen.getByRole("dialog", { name: "新增经营对象类型" });
    fireEvent.change(within(dialog).getByLabelText("对象类型名称"), {
      target: { value: "客户" },
    });
    fireEvent.change(within(dialog).getByLabelText("字段1代码"), {
      target: { value: "customer_id" },
    });
    fireEvent.change(within(dialog).getByLabelText("字段1业务名称"), {
      target: { value: "客户编号" },
    });
    fireEvent.change(within(dialog).getByLabelText("字段2代码"), {
      target: { value: "customer_name" },
    });
    fireEvent.change(within(dialog).getByLabelText("字段2业务名称"), {
      target: { value: "客户名称" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "创建对象类型" }),
    );

    await waitFor(() =>
      expect(createObjectType).toHaveBeenCalledWith("kn-1", {
        name: "客户",
        primary_key: "customer_id",
        display_key: "customer_name",
        fields: [
          { name: "customer_id", display_name: "客户编号", type: "string" },
          { name: "customer_name", display_name: "客户名称", type: "string" },
        ],
      }),
    );
    expect(await screen.findByText("客户名称")).toBeVisible();
    expect(
      screen.queryByRole("dialog", { name: "新增经营对象类型" }),
    ).not.toBeInTheDocument();
  });
});
