import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { loadOverview } from "./api";

vi.mock("./api", () => ({ loadOverview: vi.fn() }));

const overview = {
  info: {
    product: "CEO-BP",
    service: "platform-api",
    version: "0.3.0",
    environment: "demo",
    build_sha: "fullstack",
  },
  health: {
    status: "ready" as const,
    service: "platform-api",
    version: "0.3.0",
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
};

describe("App", () => {
  beforeEach(() => {
    vi.mocked(loadOverview).mockReset();
  });

  it("renders live backend status and capability states", async () => {
    vi.mocked(loadOverview).mockResolvedValue(overview);

    render(<App />);

    expect(await screen.findByText("v0.3.0")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByText("平台基础")).toBeInTheDocument();
    expect(
      screen.getByText("指标中心", { selector: "h4" }),
    ).toBeInTheDocument();
    expect(screen.getByText("已就绪")).toBeInTheDocument();
    expect(screen.getByText("规划中")).toBeInTheDocument();
  });

  it("shows an error and retries the API request", async () => {
    vi.mocked(loadOverview)
      .mockRejectedValueOnce(new Error("连接失败"))
      .mockResolvedValueOnce(overview);

    render(<App />);

    expect(await screen.findByText("连接失败")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "重新连接" }));

    await waitFor(() => expect(loadOverview).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("v0.3.0")).toBeInTheDocument();
  });

  it("opens and closes mobile navigation", async () => {
    vi.mocked(loadOverview).mockResolvedValue(overview);

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "打开导航" }));

    expect(screen.getByRole("complementary", { name: "应用导航" })).toHaveClass(
      "sidebar-open",
    );
    fireEvent.click(screen.getByRole("button", { name: "关闭导航" }));
    expect(
      screen.getByRole("complementary", { name: "应用导航" }),
    ).not.toHaveClass("sidebar-open");
  });
});
