import {
  Activity,
  BarChart3,
  BookOpenText,
  Bot,
  Boxes,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleGauge,
  DatabaseZap,
  GitBranch,
  Menu,
  Network,
  RefreshCw,
  Settings,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type Capability, loadOverview, type Overview } from "./api";

const NAV_ITEMS = [
  { label: "经营总览", icon: CircleGauge, active: true },
  { label: "指标中心", icon: BarChart3, phase: "P2" },
  { label: "企业知识", icon: BookOpenText, phase: "P3" },
  { label: "决策事项", icon: GitBranch, phase: "P3" },
  { label: "预测与模拟", icon: BrainCircuit, phase: "P4" },
];
const SKELETON_KEYS = [
  "foundation",
  "metrics",
  "knowledge",
  "decisions",
  "forecast",
];

const CAPABILITY_META: Record<
  string,
  { description: string; icon: typeof Boxes }
> = {
  "platform-foundation": {
    description: "统一契约、健康检查、请求追踪与受控部署已经就绪。",
    icon: Boxes,
  },
  metrics: {
    description: "统一指标口径、版本、目标、责任人与审批流程。",
    icon: Target,
  },
  knowledge: {
    description: "文档版本、权限、混合检索、引用与质量反馈。",
    icon: Network,
  },
  decisions: {
    description: "证据、方案、审批、行动跟踪和经营效果复盘。",
    icon: ShieldCheck,
  },
  forecast: {
    description: "统计回测、置信区间、情景比较与风险分析。",
    icon: Activity,
  },
};

function App() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      setOverview(await loadOverview(signal));
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError")
        return;
      setError(reason instanceof Error ? reason.message : "平台状态暂时不可用");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const availableCount = useMemo(
    () =>
      overview?.capabilities.filter((item) => item.status === "foundation")
        .length ?? 0,
    [overview],
  );

  return (
    <div className="app-shell">
      <aside
        className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}
        aria-label="应用导航"
      >
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <Bot size={22} strokeWidth={1.8} />
          </div>
          <div>
            <strong>CEO-BP</strong>
            <span>经营决策分析平台</span>
          </div>
          <button
            className="icon-button sidebar-close"
            type="button"
            aria-label="关闭导航"
            onClick={() => setMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="primary-nav" aria-label="主导航">
          <p className="nav-eyebrow">决策工作台</p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={`nav-item ${item.active ? "nav-active" : ""}`}
                type="button"
                key={item.label}
                aria-current={item.active ? "page" : undefined}
                disabled={!item.active}
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.label}</span>
                {item.phase ? (
                  <small>{item.phase}</small>
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            );
          })}
          <p className="nav-eyebrow nav-group">平台治理</p>
          <button className="nav-item" type="button" disabled>
            <DatabaseZap size={19} strokeWidth={1.8} />
            <span>数据与语义</span>
            <small>P1+</small>
          </button>
          <button className="nav-item" type="button" disabled>
            <Settings size={19} strokeWidth={1.8} />
            <span>系统管理</span>
            <small>P1+</small>
          </button>
        </nav>

        <div className="sidebar-foot">
          <span className="status-dot" />
          <div>
            <strong>
              {overview?.health.status === "ready"
                ? "平台基础在线"
                : "正在连接"}
            </strong>
            <small>真实状态由 platform-api 提供</small>
          </div>
        </div>
      </aside>

      {menuOpen ? (
        <button
          className="sidebar-scrim"
          type="button"
          aria-label="关闭导航遮罩"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button menu-button"
            type="button"
            aria-label="打开导航"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={21} />
          </button>
          <div>
            <p className="breadcrumb">决策工作台 / 经营总览</p>
            <h1>经营决策工作台</h1>
          </div>
          <div className="topbar-actions">
            <span className="environment-chip">
              <span className="status-dot" />
              {overview?.info.environment ?? "connecting"}
            </span>
            <a
              className="docs-link"
              href="/docs"
              target="_blank"
              rel="noreferrer"
            >
              API 文档
              <ChevronRight size={15} />
            </a>
          </div>
        </header>

        <div className="page-content">
          <section className="hero-panel">
            <div className="hero-copy">
              <span className="section-kicker">CONTROL TOWER · FOUNDATION</span>
              <h2>把经营事实、企业知识与决策行动连接成闭环</h2>
              <p>
                当前工作台只展示平台真实建设状态。指标、知识、决策与预测能力将在完成契约、权限和测试后逐步开放。
              </p>
            </div>
            <section className="hero-system" aria-label="系统链路">
              <div className="system-node system-node-active">
                <CircleGauge size={20} />
                <span>企业控制台</span>
              </div>
              <span className="connector" />
              <div className="system-node system-node-active">
                <Boxes size={20} />
                <span>Platform API</span>
              </div>
              <span className="connector connector-muted" />
              <div className="system-node system-node-planned">
                <Network size={20} />
                <span>语义 / 数据引擎</span>
              </div>
            </section>
          </section>

          {error ? (
            <ErrorState message={error} onRetry={() => void refresh()} />
          ) : null}

          <section className="stat-grid" aria-label="平台状态摘要">
            <StatusCard
              label="运行状态"
              value={
                loading
                  ? "读取中"
                  : overview?.health.status === "ready"
                    ? "就绪"
                    : "异常"
              }
              detail="前端与后端联合健康"
              tone="green"
              icon={Activity}
            />
            <StatusCard
              label="应用版本"
              value={loading ? "—" : `v${overview?.info.version ?? "—"}`}
              detail={`构建 ${overview?.info.build_sha ?? "—"}`}
              tone="blue"
              icon={Boxes}
            />
            <StatusCard
              label="已开放能力"
              value={
                loading
                  ? "—"
                  : `${availableCount} / ${overview?.capabilities.length ?? 0}`
              }
              detail="未通过门禁的能力保持隐藏"
              tone="amber"
              icon={ShieldCheck}
            />
            <StatusCard
              label="当前环境"
              value={loading ? "—" : (overview?.info.environment ?? "—")}
              detail="9006 集成 / 演示环境"
              tone="violet"
              icon={DatabaseZap}
            />
          </section>

          <section className="content-grid">
            <div className="roadmap-panel panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">CAPABILITY ROADMAP</span>
                  <h3>能力建设状态</h3>
                </div>
                <span className="live-source">实时 API</span>
              </div>
              <div className="capability-list">
                {loading
                  ? SKELETON_KEYS.map((key) => (
                      <div className="capability-skeleton" key={key} />
                    ))
                  : overview?.capabilities.map((capability) => (
                      <CapabilityRow
                        capability={capability}
                        key={capability.id}
                      />
                    ))}
              </div>
            </div>

            <aside className="principles-panel panel">
              <span className="section-kicker">DELIVERY STANDARD</span>
              <h3>全栈交付门禁</h3>
              <p>从本版本开始，每项功能按同一纵向切片交付。</p>
              <ul>
                <li>
                  <Check size={16} />
                  后端领域模型与 OpenAPI 契约
                </li>
                <li>
                  <Check size={16} />
                  前端加载、空态、错误和权限状态
                </li>
                <li>
                  <Check size={16} />
                  前后端自动测试与联合验收
                </li>
                <li>
                  <Check size={16} />
                  版本、发布、回滚和运行证据
                </li>
              </ul>
              <div className="next-slice">
                <span>下一个纵向切片</span>
                <strong>身份 / 租户上下文</strong>
                <small>随后进入指标中心最小闭环</small>
              </div>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatusCard({
  label,
  value,
  detail,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "green" | "blue" | "amber" | "violet";
  icon: typeof Activity;
}) {
  return (
    <article className="stat-card">
      <div className={`stat-icon tone-${tone}`}>
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function CapabilityRow({ capability }: { capability: Capability }) {
  const meta = CAPABILITY_META[capability.id] ?? {
    description: "能力说明将在设计基线批准后补充。",
    icon: Boxes,
  };
  const Icon = meta.icon;
  const available = capability.status === "foundation";
  return (
    <article className="capability-row">
      <div
        className={`capability-icon ${available ? "capability-active" : ""}`}
      >
        <Icon size={19} strokeWidth={1.8} />
      </div>
      <div className="capability-copy">
        <div>
          <h4>{capability.name}</h4>
          <span>{capability.target_phase}</span>
        </div>
        <p>{meta.description}</p>
      </div>
      <span
        className={`status-pill ${available ? "status-available" : "status-planned"}`}
      >
        {available ? "已就绪" : "规划中"}
      </span>
    </article>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className="error-state" role="alert">
      <div>
        <strong>暂时无法读取平台状态</strong>
        <span>{message}</span>
      </div>
      <button type="button" onClick={onRetry}>
        <RefreshCw size={16} />
        重新连接
      </button>
    </section>
  );
}

export default App;
