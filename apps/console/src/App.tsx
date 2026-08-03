import {
  AlertCircle,
  ArrowLeft,
  Boxes,
  Database,
  GitBranch,
  Layers3,
  LoaderCircle,
  Network,
  Play,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  createKnowledgeNetwork,
  createObjectType,
  getKnowledgeNetwork,
  type KnowledgeNetwork,
  listKnowledgeNetworks,
  listObjectTypes,
  type ObjectType,
} from "./knowledgeApi";
import { ObjectTypeDialog } from "./ObjectTypeDialog";

interface CreateDraft {
  name: string;
  description: string;
  tags: string;
}

const emptyDraft: CreateDraft = { name: "", description: "", tags: "" };

function errorMessage(reason: unknown): string {
  if (
    reason instanceof Error &&
    "code" in reason &&
    reason.code === "KWEAVER_NOT_CONFIGURED"
  ) {
    return "当前环境尚未连接 KWeaver，暂时不能读取知识网络。";
  }
  if (reason instanceof Error) return reason.message;
  return "知识网络请求失败，请稍后重试。";
}

function App() {
  const [networks, setNetworks] = useState<KnowledgeNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<CreateDraft>(emptyDraft);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<KnowledgeNetwork | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [objectTypes, setObjectTypes] = useState<ObjectType[]>([]);
  const [objectTypesLoading, setObjectTypesLoading] = useState(false);
  const [objectTypesError, setObjectTypesError] = useState<string | null>(null);
  const [objectCreateOpen, setObjectCreateOpen] = useState(false);
  const [objectCreating, setObjectCreating] = useState(false);
  const [objectCreateError, setObjectCreateError] = useState<string | null>(
    null,
  );

  const loadNetworks = useCallback(
    async (pattern: string, signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const page = await listKnowledgeNetworks(pattern, signal);
        setNetworks(page.items);
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;
        setNetworks([]);
        setError(errorMessage(reason));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadNetworks("", controller.signal);
    return () => controller.abort();
  }, [loadNetworks]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const pattern = searchDraft.trim();
    setActiveSearch(pattern);
    void loadNetworks(pattern);
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setError(null);
    setNotice(null);
    try {
      const detail = await getKnowledgeNetwork(id);
      setSelected(detail);
      setObjectTypes([]);
      setObjectTypesLoading(true);
      setObjectTypesError(null);
      try {
        const page = await listObjectTypes(id);
        setObjectTypes(page.items);
      } catch (reason) {
        setObjectTypesError(errorMessage(reason));
      } finally {
        setObjectTypesLoading(false);
      }
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setDetailLoading(false);
    }
  };

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    const name = createDraft.name.trim();
    if (!name) {
      setCreateError("请填写知识网络名称。");
      return;
    }
    const tags = [
      ...new Set(
        createDraft.tags
          .split(/[,，]/)
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    ];
    setCreating(true);
    setCreateError(null);
    try {
      const created = await createKnowledgeNetwork({
        name,
        description: createDraft.description.trim() || undefined,
        tags,
      });
      setCreateOpen(false);
      setCreateDraft(emptyDraft);
      setSelected(created);
      setObjectTypes([]);
      setNotice(`已创建“${created.name}”，可继续定义对象、关系和指标。`);
      await loadNetworks(activeSearch);
    } catch (reason) {
      setCreateError(errorMessage(reason));
    } finally {
      setCreating(false);
    }
  };

  const reloadObjectTypes = async () => {
    if (!selected) return;
    setObjectTypesLoading(true);
    setObjectTypesError(null);
    try {
      const page = await listObjectTypes(selected.id);
      setObjectTypes(page.items);
    } catch (reason) {
      setObjectTypesError(errorMessage(reason));
    } finally {
      setObjectTypesLoading(false);
    }
  };

  const submitObjectType = async (
    input: Parameters<typeof createObjectType>[1],
  ) => {
    if (!selected) return;
    setObjectCreating(true);
    setObjectCreateError(null);
    try {
      const created = await createObjectType(selected.id, input);
      setObjectTypes((current) => [...current, created]);
      setObjectCreateOpen(false);
      setNotice(`已在“${selected.name}”中创建经营对象“${created.name}”。`);
      try {
        setSelected(await getKnowledgeNetwork(selected.id));
      } catch {
        // The created object is already authoritative; a statistics refresh may retry later.
      }
    } catch (reason) {
      setObjectCreateError(errorMessage(reason));
    } finally {
      setObjectCreating(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label="CEO-BP 知识网络">
          <span className="brand-mark" aria-hidden="true">
            <Network size={21} />
          </span>
          <span>
            <strong>CEO-BP</strong>
            <small>企业经营决策分析</small>
          </span>
        </a>
        <span className="current-module">知识网络</span>
      </header>

      <main className="page-content">
        <div className="page-heading">
          <div>
            <p>KWeaver 业务知识网络</p>
            <h1>把经营数据组织成可查询的业务语义</h1>
            <span>
              在这里维护对象、关系、动作和指标，后续分析与决策引用同一套口径。
            </span>
          </div>
          <button
            className="button primary"
            type="button"
            onClick={() => {
              setCreateError(null);
              setCreateOpen(true);
            }}
          >
            <Plus size={16} /> 创建知识网络
          </button>
        </div>

        {notice && !selected ? (
          <div className="notice success" role="status">
            {notice}
          </div>
        ) : null}

        <section className="workspace" aria-labelledby="network-list-heading">
          <div className="workspace-header">
            <div>
              <h2 id="network-list-heading">业务知识网络</h2>
              <p>选择一个网络查看其业务范围和经营对象。</p>
            </div>
            <div className="toolbar">
              <form className="search-form" onSubmit={submitSearch}>
                <label className="search-box">
                  <Search size={16} aria-hidden="true" />
                  <span className="sr-only">按名称搜索知识网络</span>
                  <input
                    aria-label="按名称搜索知识网络"
                    value={searchDraft}
                    onChange={(event) => setSearchDraft(event.target.value)}
                    placeholder="输入名称或关键字"
                  />
                </label>
                <button className="button secondary" type="submit">
                  查询
                </button>
              </form>
              <button
                aria-label="刷新知识网络列表"
                className="icon-button"
                type="button"
                onClick={() => void loadNetworks(activeSearch)}
              >
                <RefreshCw size={17} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="state-panel" role="status">
              <LoaderCircle className="spin" size={22} /> 正在读取知识网络…
            </div>
          ) : error ? (
            <div className="state-panel error-panel" role="alert">
              <AlertCircle size={22} />
              <div>
                <strong>无法读取知识网络</strong>
                <p>{error}</p>
              </div>
              <button
                className="button secondary"
                type="button"
                onClick={() => void loadNetworks(activeSearch)}
              >
                重试
              </button>
            </div>
          ) : networks.length === 0 ? (
            <div className="state-panel empty-state">
              <Boxes size={25} />
              <strong>
                {activeSearch ? "没有匹配的知识网络" : "还没有知识网络"}
              </strong>
              <p>
                {activeSearch
                  ? "调整名称关键字后重新查询。"
                  : "创建后即可定义经营对象、关系和指标。"}
              </p>
            </div>
          ) : (
            <div className="network-list">
              {networks.map((network) => (
                <article className="network-row" key={network.id}>
                  <div className="network-icon" aria-hidden="true">
                    <Network size={20} />
                  </div>
                  <div className="network-identity">
                    <strong>{network.name}</strong>
                    <code>{network.id}</code>
                    <p>{network.description || "暂无说明"}</p>
                  </div>
                  <div className="tags">
                    {network.tags.length
                      ? network.tags.map((tag) => <span key={tag}>{tag}</span>)
                      : "—"}
                  </div>
                  <button
                    className="button text-button"
                    type="button"
                    disabled={detailLoading}
                    onClick={() => void openDetail(network.id)}
                  >
                    查看详情
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {createOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section
            aria-labelledby="create-network-heading"
            aria-modal="true"
            className="modal"
            role="dialog"
          >
            <div className="modal-header">
              <div>
                <p>新建</p>
                <h2 id="create-network-heading">创建业务知识网络</h2>
              </div>
              <button
                aria-label="关闭创建窗口"
                className="icon-button"
                type="button"
                onClick={() => setCreateOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitCreate}>
              <label className="field">
                <span>
                  名称 <b>必填</b>
                </span>
                <input
                  aria-label="知识网络名称"
                  maxLength={120}
                  value={createDraft.name}
                  onChange={(event) =>
                    setCreateDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="例如：集团经营分析网络"
                />
              </label>
              <label className="field">
                <span>说明</span>
                <textarea
                  aria-label="知识网络说明"
                  maxLength={500}
                  rows={4}
                  value={createDraft.description}
                  onChange={(event) =>
                    setCreateDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="说明该网络覆盖的业务范围和使用场景"
                />
              </label>
              <label className="field">
                <span>标签</span>
                <input
                  aria-label="知识网络标签"
                  value={createDraft.tags}
                  onChange={(event) =>
                    setCreateDraft((current) => ({
                      ...current,
                      tags: event.target.value,
                    }))
                  }
                  placeholder="多个标签用逗号分隔"
                />
              </label>
              {createError ? (
                <p className="form-error" role="alert">
                  {createError}
                </p>
              ) : null}
              <div className="modal-actions">
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setCreateOpen(false)}
                >
                  取消
                </button>
                <button
                  className="button primary"
                  disabled={creating}
                  type="submit"
                >
                  {creating ? (
                    <LoaderCircle className="spin" size={16} />
                  ) : (
                    <Plus size={16} />
                  )}
                  {creating ? "正在创建" : "创建知识网络"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {selected ? (
        <div className="drawer-backdrop" role="presentation">
          <aside
            aria-labelledby="network-detail-heading"
            aria-modal="true"
            className="drawer"
            role="dialog"
          >
            <div className="drawer-header">
              <button
                aria-label="返回知识网络列表"
                className="icon-button"
                type="button"
                onClick={() => setSelected(null)}
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <p>知识网络详情</p>
                <h2 id="network-detail-heading">{selected.name}</h2>
              </div>
            </div>
            <div className="detail-body">
              {notice ? (
                <div className="notice success" role="status">
                  {notice}
                </div>
              ) : null}
              <dl className="detail-list">
                <div>
                  <dt>网络 ID</dt>
                  <dd>
                    <code>{selected.id}</code>
                  </dd>
                </div>
                <div>
                  <dt>说明</dt>
                  <dd>{selected.description || "暂无说明"}</dd>
                </div>
                <div>
                  <dt>标签</dt>
                  <dd>{selected.tags.join("、") || "暂无标签"}</dd>
                </div>
              </dl>
              <h3>模式规模</h3>
              <div className="stat-grid">
                <Stat
                  icon={<Database size={18} />}
                  label="对象类型"
                  value={selected.statistics?.object_types}
                />
                <Stat
                  icon={<GitBranch size={18} />}
                  label="关系类型"
                  value={selected.statistics?.relation_types}
                />
                <Stat
                  icon={<Play size={18} />}
                  label="动作类型"
                  value={selected.statistics?.action_types}
                />
                <Stat
                  icon={<Layers3 size={18} />}
                  label="概念分组"
                  value={selected.statistics?.concept_groups}
                />
              </div>
              <section
                className="object-section"
                aria-labelledby="object-types-heading"
              >
                <div className="section-heading">
                  <div>
                    <h3 id="object-types-heading">经营对象</h3>
                    <p>定义决策分析中可识别、关联和查询的业务实体。</p>
                  </div>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => {
                      setObjectCreateError(null);
                      setObjectCreateOpen(true);
                    }}
                  >
                    <Plus size={15} /> 新增对象类型
                  </button>
                </div>
                {objectTypesLoading ? (
                  <div className="object-state" role="status">
                    <LoaderCircle className="spin" size={17} />{" "}
                    正在读取经营对象…
                  </div>
                ) : objectTypesError ? (
                  <div className="object-state error-panel" role="alert">
                    <span>{objectTypesError}</span>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => void reloadObjectTypes()}
                    >
                      重试
                    </button>
                  </div>
                ) : objectTypes.length === 0 ? (
                  <div className="object-state empty-state">
                    <strong>尚未定义经营对象</strong>
                    <p>先创建客户、产品、组织等对象，再配置关系和指标。</p>
                  </div>
                ) : (
                  <div className="object-list">
                    {objectTypes.map((objectType) => (
                      <article className="object-item" key={objectType.id}>
                        <div className="object-title">
                          <strong>{objectType.name}</strong>
                          <span>{objectType.fields.length} 个字段</span>
                        </div>
                        <div className="object-fields">
                          {objectType.fields.map((field) => (
                            <span key={field.name}>
                              <b>{field.display_name}</b>
                              <code>{field.name}</code>
                              {objectType.primary_keys.includes(field.name) ? (
                                <em>主键</em>
                              ) : null}
                              {objectType.display_key === field.name ? (
                                <em>显示</em>
                              ) : null}
                            </span>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </aside>
        </div>
      ) : null}

      {selected && objectCreateOpen ? (
        <ObjectTypeDialog
          busy={objectCreating}
          error={objectCreateError}
          networkName={selected.name}
          onClose={() => setObjectCreateOpen(false)}
          onSubmit={(input) => void submitObjectType(input)}
        />
      ) : null}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
}) {
  return (
    <div className="stat-item">
      <span aria-hidden="true">{icon}</span>
      <div>
        <strong>{value ?? "—"}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}

export default App;
