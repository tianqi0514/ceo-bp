import {
  Activity,
  BookOpen,
  Box,
  CheckCircle2,
  Clock3,
  ExternalLink,
  RefreshCw,
  Server,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { loadOverview, type Overview } from "./api";

const DATE_FORMAT = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "medium",
  hour12: false,
});

function formatTimestamp(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : DATE_FORMAT.format(date);
}

function formatUptime(totalSeconds: number | undefined): string {
  if (totalSeconds === undefined) return "—";
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  if (days > 0) return `${days} 天 ${hours} 小时`;
  if (hours > 0) return `${hours} 小时 ${minutes} 分钟`;
  return `${minutes} 分钟`;
}

function App() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(true);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setRefreshing(true);
    setError(null);
    try {
      const nextOverview = await loadOverview(signal);
      setOverview(nextOverview);
      setCheckedAt(new Date().toISOString());
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError")
        return;
      setError(reason instanceof Error ? reason.message : "系统状态暂时不可用");
    } finally {
      if (!signal?.aborted) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const initialLoading = refreshing && !overview;
  const isReady = overview?.health.status === "ready";

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label="CEO-BP 系统运行状态首页">
          <span className="brand-mark" aria-hidden="true">
            <Server size={21} />
          </span>
          <span>
            <strong>CEO-BP</strong>
            <small>企业经营决策分析平台</small>
          </span>
        </a>
        <nav className="header-actions" aria-label="页面操作">
          <a
            className="text-link"
            href="/docs"
            target="_blank"
            rel="noreferrer"
          >
            <BookOpen size={17} />
            API 文档
            <ExternalLink size={14} />
          </a>
          <button
            className="refresh-button"
            type="button"
            disabled={refreshing}
            onClick={() => void refresh()}
          >
            <RefreshCw className={refreshing ? "is-spinning" : ""} size={17} />
            {refreshing ? "正在刷新" : "刷新状态"}
          </button>
        </nav>
      </header>

      <main className="page-content">
        <div className="page-heading">
          <div>
            <p>系统管理</p>
            <h1>运行状态</h1>
            <span>确认当前部署是否可访问，以及正在运行的版本。</span>
          </div>
          <StatusBadge ready={isReady} loading={initialLoading} />
        </div>

        {error ? (
          <ErrorState message={error} onRetry={() => void refresh()} />
        ) : null}

        <section className="summary-grid" aria-label="运行状态摘要">
          <SummaryCard
            icon={Activity}
            label="服务状态"
            value={initialLoading ? "读取中" : isReady ? "正常" : "不可用"}
            detail={overview?.info.service ?? "platform-api"}
          />
          <SummaryCard
            icon={Clock3}
            label="持续运行"
            value={
              initialLoading ? "—" : formatUptime(overview?.uptime_seconds)
            }
            detail={`启动于 ${formatTimestamp(overview?.started_at ?? null)}`}
          />
          <SummaryCard
            icon={Box}
            label="应用版本"
            value={initialLoading ? "—" : `v${overview?.info.version ?? "—"}`}
            detail={`构建 ${overview?.info.build_sha ?? "—"}`}
          />
          <SummaryCard
            icon={Server}
            label="运行环境"
            value={initialLoading ? "—" : (overview?.info.environment ?? "—")}
            detail="当前服务返回的环境标识"
          />
        </section>

        <section className="details-grid">
          <article className="panel service-panel">
            <div className="panel-heading">
              <div>
                <h2>服务信息</h2>
                <p>以下内容直接来自当前运行实例。</p>
              </div>
            </div>
            <dl className="service-details">
              <DetailRow
                label="服务名称"
                value={overview?.info.service}
                loading={initialLoading}
              />
              <DetailRow
                label="产品名称"
                value={overview?.info.product}
                loading={initialLoading}
              />
              <DetailRow
                label="服务端时间"
                value={formatTimestamp(overview?.server_time ?? null)}
                loading={initialLoading}
              />
              <DetailRow
                label="本次检查"
                value={formatTimestamp(checkedAt)}
                loading={initialLoading}
              />
            </dl>
          </article>

          <article className="panel endpoints-panel">
            <div className="panel-heading">
              <div>
                <h2>可用接口</h2>
                <p>点击路径会在新窗口打开对应的实际地址。</p>
              </div>
              <span>{overview?.endpoints.length ?? 0} 个</span>
            </div>
            <div className="endpoint-list">
              {initialLoading ? (
                <LoadingRows />
              ) : (
                overview?.endpoints.map((endpoint) => (
                  <a
                    className="endpoint-row"
                    href={endpoint.path}
                    target="_blank"
                    rel="noreferrer"
                    key={endpoint.path}
                  >
                    <code>{endpoint.method}</code>
                    <span>
                      <strong>{endpoint.name}</strong>
                      <small>{endpoint.path}</small>
                    </span>
                    <ExternalLink size={15} aria-hidden="true" />
                  </a>
                ))
              )}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

function StatusBadge({ ready, loading }: { ready: boolean; loading: boolean }) {
  return (
    <div
      className={`status-badge ${ready ? "status-ready" : ""}`}
      role="status"
    >
      {loading ? (
        <RefreshCw className="is-spinning" size={17} />
      ) : ready ? (
        <CheckCircle2 size={17} />
      ) : (
        <TriangleAlert size={17} />
      )}
      {loading ? "正在检查" : ready ? "服务正常" : "需要检查"}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="summary-card">
      <Icon size={20} aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function DetailRow({
  label,
  value,
  loading,
}: {
  label: string;
  value?: string;
  loading: boolean;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{loading ? "读取中" : (value ?? "—")}</dd>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="loading-rows" role="status" aria-label="正在读取接口列表">
      <span />
      <span />
      <span />
    </div>
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
      <TriangleAlert size={20} aria-hidden="true" />
      <div>
        <strong>无法读取运行状态</strong>
        <span>{message}</span>
      </div>
      <button type="button" onClick={onRetry}>
        重新检查
      </button>
    </section>
  );
}

export default App;
