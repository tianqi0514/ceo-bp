import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { loadOverview } from "./api";

vi.mock("./api", () => ({ loadOverview: vi.fn() }));

const overview = {
  info: {
    product: "CEO-BP",
    service: "platform-api",
    version: "0.3.1",
    environment: "demo",
    build_sha: "practical-ui",
  },
  health: {
    status: "ready" as const,
    service: "platform-api",
    version: "0.3.1",
  },
  capabilities: [
    {
      id: "platform-foundation",
      name: "平台基础",
      status: "foundation" as const,
      target_phase: "P1",
    },
    {
      id: "metrics",
      name: "指标中心",
      status: "planned" as const,
      target_phase: "P2",
    },
  ],
  started_at: "2026-07-30T10:00:00Z",
  server_time: "2026-07-30T12:05:00Z",
  uptime_seconds: 7_500,
  endpoints: [
    { method: "GET" as const, path: "/health/ready", name: "服务就绪检查" },
    { method: "GET" as const, path: "/docs", name: "API 文档" },
  ],
};

describe("App", () => {
  beforeEach(() => {
    vi.mocked(loadOverview).mockReset();
  });

  it("renders only live operational data and working links", async () => {
    vi.mocked(loadOverview).mockResolvedValue(overview);

    render(<App />);

    expect(await screen.findByText("v0.3.1")).toBeInTheDocument();
    expect(screen.getByText("服务正常")).toBeInTheDocument();
    expect(screen.getByText("2 小时 5 分钟")).toBeInTheDocument();
    expect(screen.getByText("构建 practical-ui")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /服务就绪检查/ })).toHaveAttribute(
      "href",
      "/health/ready",
    );
    expect(screen.queryByText("规划中")).not.toBeInTheDocument();
    expect(screen.queryByText("下一个纵向切片")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("button", { hidden: true })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "刷新状态" })).toBeEnabled();
  });

  it("shows an error and retries the API request", async () => {
    vi.mocked(loadOverview)
      .mockRejectedValueOnce(new Error("连接失败"))
      .mockResolvedValueOnce(overview);

    render(<App />);

    expect(await screen.findByText("连接失败")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "重新检查" }));

    await waitFor(() => expect(loadOverview).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("v0.3.1")).toBeInTheDocument();
  });

  it("refreshes operational data when the user asks", async () => {
    vi.mocked(loadOverview).mockResolvedValue(overview);

    render(<App />);
    await screen.findByText("v0.3.1");
    fireEvent.click(screen.getByRole("button", { name: "刷新状态" }));

    await waitFor(() => expect(loadOverview).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("button", { name: "刷新状态" })).toBeEnabled();
  });
});
