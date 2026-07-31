import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  CircleGauge,
  Plus,
  Scale,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  type RefObject,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  analyzeDecision,
  type CriterionDirection,
  type DecisionAnalysis,
  type DecisionAnalysisRequest,
} from "./api";

type NumericInput = number | "";

interface CriterionDraft {
  id: string;
  name: string;
  weight: NumericInput;
  direction: CriterionDirection;
}

interface OptionDraft {
  id: string;
  name: string;
  scores: Record<string, NumericInput>;
}

const initialCriteria: CriterionDraft[] = [
  { id: "criterion-1", name: "", weight: "", direction: "benefit" },
  { id: "criterion-2", name: "", weight: "", direction: "benefit" },
];

const initialOptions: OptionDraft[] = [
  {
    id: "option-1",
    name: "",
    scores: { "criterion-1": "", "criterion-2": "" },
  },
  {
    id: "option-2",
    name: "",
    scores: { "criterion-1": "", "criterion-2": "" },
  },
];

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function App() {
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [criteria, setCriteria] = useState<CriterionDraft[]>(initialCriteria);
  const [options, setOptions] = useState<OptionDraft[]>(initialOptions);
  const [analysis, setAnalysis] = useState<DecisionAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const resultRef = useRef<HTMLElement>(null);

  const weightTotal = useMemo(
    () =>
      criteria.reduce(
        (total, criterion) =>
          total + (criterion.weight === "" ? 0 : criterion.weight),
        0,
      ),
    [criteria],
  );

  const updateCriterion = (
    id: string,
    patch: Partial<Omit<CriterionDraft, "id">>,
  ) => {
    setCriteria((current) =>
      current.map((criterion) =>
        criterion.id === id ? { ...criterion, ...patch } : criterion,
      ),
    );
    setAnalysis(null);
  };

  const addCriterion = () => {
    if (criteria.length >= 8) return;
    const id = nextId("criterion");
    setCriteria((current) => [
      ...current,
      { id, name: "", weight: "", direction: "benefit" },
    ]);
    setOptions((current) =>
      current.map((option) => ({
        ...option,
        scores: { ...option.scores, [id]: "" },
      })),
    );
    setAnalysis(null);
  };

  const removeCriterion = (id: string) => {
    if (criteria.length <= 2) return;
    setCriteria((current) =>
      current.filter((criterion) => criterion.id !== id),
    );
    setOptions((current) =>
      current.map((option) => {
        const scores = { ...option.scores };
        delete scores[id];
        return { ...option, scores };
      }),
    );
    setAnalysis(null);
  };

  const addOption = () => {
    if (options.length >= 6) return;
    const id = nextId("option");
    setOptions((current) => [
      ...current,
      {
        id,
        name: "",
        scores: Object.fromEntries(
          criteria.map((criterion) => [criterion.id, ""]),
        ),
      },
    ]);
    setAnalysis(null);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions((current) => current.filter((option) => option.id !== id));
    setAnalysis(null);
  };

  const updateOptionName = (id: string, name: string) => {
    setOptions((current) =>
      current.map((option) =>
        option.id === id ? { ...option, name } : option,
      ),
    );
    setAnalysis(null);
  };

  const updateScore = (
    optionId: string,
    criterionId: string,
    value: NumericInput,
  ) => {
    setOptions((current) =>
      current.map((option) =>
        option.id === optionId
          ? { ...option, scores: { ...option.scores, [criterionId]: value } }
          : option,
      ),
    );
    setAnalysis(null);
  };

  const validate = (): string | null => {
    if (title.trim().length < 3) return "请填写至少 3 个字的决策标题。";
    if (criteria.some((criterion) => !criterion.name.trim()))
      return "请填写所有评价维度的名称。";
    if (
      new Set(criteria.map((criterion) => criterion.name.trim())).size !==
      criteria.length
    )
      return "评价维度名称不能重复。";
    if (
      criteria.some(
        (criterion) => criterion.weight === "" || criterion.weight <= 0,
      )
    )
      return "每个评价维度都需要填写大于 0 的权重。";
    if (options.some((option) => !option.name.trim()))
      return "请填写所有备选方案的名称。";
    if (
      new Set(options.map((option) => option.name.trim())).size !==
      options.length
    )
      return "备选方案名称不能重复。";
    if (
      options.some((option) =>
        criteria.some((criterion) => {
          const score = option.scores[criterion.id];
          return score === "" || score < 0 || score > 100;
        }),
      )
    )
      return "请为每个方案填写 0 到 100 之间的完整评分。";
    return null;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setAnalysis(null);
      return;
    }

    const request: DecisionAnalysisRequest = {
      title: title.trim(),
      objective: objective.trim(),
      criteria: criteria.map((criterion) => ({
        ...criterion,
        name: criterion.name.trim(),
        weight: Number(criterion.weight),
      })),
      options: options.map((option) => ({
        id: option.id,
        name: option.name.trim(),
        scores: Object.fromEntries(
          criteria.map((criterion) => [
            criterion.id,
            Number(option.scores[criterion.id]),
          ]),
        ),
      })),
    };

    setSubmitting(true);
    setError(null);
    try {
      const result = await analyzeDecision(request);
      setAnalysis(result);
      window.setTimeout(
        () =>
          resultRef.current?.scrollIntoView?.({
            behavior: "smooth",
            block: "start",
          }),
        0,
      );
    } catch (reason) {
      setAnalysis(null);
      setError(
        reason instanceof Error ? reason.message : "分析失败，请稍后重试。",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label="CEO-BP 决策分析首页">
          <span className="brand-mark" aria-hidden="true">
            <Scale size={21} />
          </span>
          <span>
            <strong>CEO-BP</strong>
            <small>企业经营决策分析</small>
          </span>
        </a>
        <span className="privacy-note">本次输入不会保存</span>
      </header>

      <main className="page-content">
        <div className="page-heading">
          <div>
            <p>方案比较</p>
            <h1>建立一份可复核的决策分析</h1>
            <span className="page-subtitle">
              定义评价标准，为备选方案评分，再检查结论是否稳定。
            </span>
          </div>
          <ol className="step-indicator" aria-label="分析步骤">
            <li>1 定义</li>
            <li className="step-arrow" aria-hidden="true">
              <ArrowRight size={14} />
            </li>
            <li>2 评分</li>
            <li className="step-arrow" aria-hidden="true">
              <ArrowRight size={14} />
            </li>
            <li>3 分析</li>
          </ol>
        </div>

        <form onSubmit={submit} noValidate>
          <section className="form-section" aria-labelledby="decision-heading">
            <SectionHeading
              number="01"
              title="定义决策"
              description="写清楚需要决定什么，以及这次比较要实现的目标。"
            />
            <div className="field-grid">
              <label className="field">
                <span>
                  决策标题 <b>必填</b>
                </span>
                <input
                  aria-label="决策标题"
                  maxLength={120}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setAnalysis(null);
                  }}
                  placeholder="例如：选择下一年度重点进入的区域市场"
                  value={title}
                />
              </label>
              <label className="field">
                <span>决策目标</span>
                <textarea
                  aria-label="决策目标"
                  maxLength={500}
                  onChange={(event) => {
                    setObjective(event.target.value);
                    setAnalysis(null);
                  }}
                  placeholder="说明希望达成的结果、约束或决策边界"
                  rows={3}
                  value={objective}
                />
              </label>
            </div>
          </section>

          <section className="form-section" aria-labelledby="criteria-heading">
            <SectionHeading
              number="02"
              title="设置评价维度"
              description="权重不必强制合计 100，系统会按比例归一化。"
              action={
                criteria.length < 8 ? (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={addCriterion}
                  >
                    <Plus size={16} />
                    添加维度
                  </button>
                ) : (
                  <span className="limit-note">已达到 8 个维度上限</span>
                )
              }
            />
            <div className="criteria-list">
              {criteria.map((criterion, index) => (
                <div className="criterion-row" key={criterion.id}>
                  <span className="row-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <label className="compact-field criterion-name">
                    <span>维度名称</span>
                    <input
                      aria-label={`评价维度 ${index + 1} 名称`}
                      maxLength={60}
                      onChange={(event) =>
                        updateCriterion(criterion.id, {
                          name: event.target.value,
                        })
                      }
                      placeholder="例如：预期收益"
                      value={criterion.name}
                    />
                  </label>
                  <label className="compact-field weight-field">
                    <span>权重</span>
                    <div className="number-suffix">
                      <input
                        aria-label={`评价维度 ${index + 1} 权重`}
                        max={100}
                        min={0.01}
                        onChange={(event) =>
                          updateCriterion(criterion.id, {
                            weight:
                              event.target.value === ""
                                ? ""
                                : Number(event.target.value),
                          })
                        }
                        placeholder="0"
                        step="0.01"
                        type="number"
                        value={criterion.weight}
                      />
                      <span>%</span>
                    </div>
                  </label>
                  <label className="compact-field direction-field">
                    <span>评分方向</span>
                    <div className="select-wrap">
                      <select
                        aria-label={`评价维度 ${index + 1} 评分方向`}
                        onChange={(event) =>
                          updateCriterion(criterion.id, {
                            direction: event.target.value as CriterionDirection,
                          })
                        }
                        value={criterion.direction}
                      >
                        <option value="benefit">越高越好</option>
                        <option value="cost">越低越好</option>
                      </select>
                      <ChevronDown size={15} />
                    </div>
                  </label>
                  {criteria.length > 2 ? (
                    <button
                      aria-label={`删除评价维度 ${index + 1}`}
                      className="icon-button"
                      onClick={() => removeCriterion(criterion.id)}
                      title="删除这个评价维度"
                      type="button"
                    >
                      <Trash2 size={17} />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            <div
              className={`weight-total ${weightTotal === 100 ? "is-complete" : ""}`}
              role="status"
              aria-label={`当前权重合计 ${weightTotal.toLocaleString("zh-CN")}%`}
            >
              {weightTotal === 100 ? (
                <Check size={15} />
              ) : (
                <CircleGauge size={15} />
              )}
              当前权重合计{" "}
              <strong>{weightTotal.toLocaleString("zh-CN")}</strong>%
              {weightTotal !== 100 ? <span>分析时会自动归一化</span> : null}
            </div>
          </section>

          <section
            className="form-section scoring-section"
            aria-labelledby="scoring-heading"
          >
            <SectionHeading
              number="03"
              title="为方案评分"
              description="评分范围为 0—100。请依据可核验数据或团队判断填写。"
              action={
                options.length < 6 ? (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={addOption}
                  >
                    <Plus size={16} />
                    添加方案
                  </button>
                ) : (
                  <span className="limit-note">已达到 6 个方案上限</span>
                )
              }
            />
            <div className="matrix-wrap">
              <table className="score-matrix">
                <thead>
                  <tr>
                    <th className="option-column" scope="col">
                      备选方案
                    </th>
                    {criteria.map((criterion, index) => (
                      <th scope="col" key={criterion.id}>
                        <span>
                          {criterion.name.trim() || `维度 ${index + 1}`}
                        </span>
                        <small>
                          {criterion.direction === "benefit"
                            ? "越高越好"
                            : "越低越好"}
                        </small>
                      </th>
                    ))}
                    {options.length > 2 ? (
                      <th aria-label="方案操作" scope="col" />
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {options.map((option, optionIndex) => (
                    <tr key={option.id}>
                      <th scope="row">
                        <input
                          aria-label={`方案 ${optionIndex + 1} 名称`}
                          maxLength={80}
                          onChange={(event) =>
                            updateOptionName(option.id, event.target.value)
                          }
                          placeholder={`方案 ${optionIndex + 1} 名称`}
                          value={option.name}
                        />
                      </th>
                      {criteria.map((criterion, criterionIndex) => (
                        <td key={criterion.id}>
                          <input
                            aria-label={`方案 ${optionIndex + 1} 在评价维度 ${criterionIndex + 1} 的评分`}
                            max={100}
                            min={0}
                            onChange={(event) =>
                              updateScore(
                                option.id,
                                criterion.id,
                                event.target.value === ""
                                  ? ""
                                  : Number(event.target.value),
                              )
                            }
                            placeholder="0—100"
                            step="0.1"
                            type="number"
                            value={option.scores[criterion.id]}
                          />
                        </td>
                      ))}
                      {options.length > 2 ? (
                        <td>
                          <button
                            aria-label={`删除方案 ${optionIndex + 1}`}
                            className="icon-button"
                            onClick={() => removeOption(option.id)}
                            title="删除这个备选方案"
                            type="button"
                          >
                            <Trash2 size={17} />
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {error ? (
            <div className="form-error" role="alert">
              <AlertTriangle size={19} />
              <div>
                <strong>暂时无法生成分析</strong>
                <span>{error}</span>
              </div>
            </div>
          ) : null}

          <div className="submit-row">
            <div>
              <ShieldAlert size={17} />
              <span>结果用于辅助比较，不替代事实核验与最终审批。</span>
            </div>
            <button
              className="primary-button"
              disabled={submitting}
              type="submit"
            >
              <BarChart3 size={18} />
              {submitting ? "正在分析" : error ? "重新分析" : "开始分析"}
            </button>
          </div>
        </form>

        {analysis ? (
          <AnalysisResult analysis={analysis} resultRef={resultRef} />
        ) : null}
      </main>
    </div>
  );
}

function SectionHeading({
  number,
  title,
  description,
  action,
}: {
  number: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const id = `${title === "定义决策" ? "decision" : title === "设置评价维度" ? "criteria" : "scoring"}-heading`;
  return (
    <div className="section-heading">
      <span className="section-number">{number}</span>
      <div>
        <h2 id={id}>{title}</h2>
        <p>{description}</p>
      </div>
      {action ? <div className="section-action">{action}</div> : null}
    </div>
  );
}

function AnalysisResult({
  analysis,
  resultRef,
}: {
  analysis: DecisionAnalysis;
  resultRef: RefObject<HTMLElement | null>;
}) {
  const recommended = analysis.ranking.find(
    (item) => item.option_id === analysis.recommended_option_id,
  );
  return (
    <section
      className="result-section"
      ref={resultRef}
      aria-labelledby="result-heading"
    >
      <div className="result-heading">
        <div>
          <p>分析结果</p>
          <h2 id="result-heading">建议优先考虑 {recommended?.option_name}</h2>
          <span className="result-summary">
            综合得分 {recommended?.score.toFixed(2)}，领先第二名{" "}
            {analysis.score_gap.toFixed(2)} 分。
          </span>
        </div>
        <div className={`stability-badge ${analysis.stability}`}>
          {analysis.stability === "stable" ? (
            <Check size={17} />
          ) : (
            <AlertTriangle size={17} />
          )}
          {analysis.stability === "stable" ? "排序相对稳定" : "排序对权重敏感"}
        </div>
      </div>

      <div className="ranking-list">
        {analysis.ranking.map((option) => (
          <article className="ranking-card" key={option.option_id}>
            <div className="rank-number">{option.rank}</div>
            <div className="rank-main">
              <div className="rank-title">
                <strong>{option.option_name}</strong>
                {option.option_id === analysis.recommended_option_id ? (
                  <span>首选</span>
                ) : null}
              </div>
              <meter
                className="score-track"
                aria-label={`${option.option_name} 得分`}
                max={100}
                min={0}
                value={option.score}
              />
              {option.weaknesses.length > 0 ? (
                <small>需重点核查：{option.weaknesses.join("、")}</small>
              ) : (
                <small>未发现高权重低分项</small>
              )}
            </div>
            <strong className="score-value">{option.score.toFixed(2)}</strong>
            <details className="calculation-details">
              <summary>查看计算明细</summary>
              <table>
                <thead>
                  <tr>
                    <th>维度</th>
                    <th>原始评分</th>
                    <th>方向换算</th>
                    <th>加权得分</th>
                  </tr>
                </thead>
                <tbody>
                  {option.contributions.map((item) => (
                    <tr key={item.criterion_id}>
                      <td>{item.criterion_name}</td>
                      <td>{item.raw_score}</td>
                      <td>{item.adjusted_score}</td>
                      <td>{item.weighted_points.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </article>
        ))}
      </div>

      <div className="result-notes">
        <article>
          <h3>结论检查</h3>
          {analysis.sensitive_criteria.length > 0 ? (
            <p>
              敏感维度：{analysis.sensitive_criteria.join("、")}
              。建议复核这些权重。
            </p>
          ) : (
            <p>各维度权重上下浮动 20% 时，首选方案没有变化。</p>
          )}
        </article>
        <article>
          <h3>使用边界</h3>
          <ul>
            {analysis.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </article>
      </div>
      <p className="methodology">计算方法：{analysis.methodology}</p>
    </section>
  );
}

export default App;
