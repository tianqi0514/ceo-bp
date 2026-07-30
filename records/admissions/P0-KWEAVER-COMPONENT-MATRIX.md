# P0 KWeaver 组件准入矩阵

- 记录编号：ADM-2026-0001
- 日期：2026-07-30
- 状态：Preliminary（不得作为生产准入批准）
- 责任角色：架构、安全与许可证负责人

## 1. 审查基线

| 仓库 | 审查提交 | 提交日期 |
|---|---|---|
| kweaver-core | `b9b35fb245c31660127114c883e91165b42dc8f0` | 2026-05-22 |
| kweaver-dip | `534fa829836123f36c611874829838a1ff65a4ba` | 2026-07-02 |
| kweaver-sdk | `b5e7a3b5ef36604e0d7b05d688287562815add87` | 2026-06-02 |
| kweaver-admin | `4b234dff2f6117b597467a19d4cff6d03d59ae83` | 2026-04-24 |

审查覆盖源码结构、发布清单、主要契约、重复模块、构建/测试可执行性、部署与明显安全/许可证风险。尚未完成全部服务的可重现构建、性能和法律批准。

## 2. 初步处置矩阵

| 能力/组件 | 来源 | 初步结论 | 价值 | 准入前强制条件 |
|---|---|---|---|---|
| BKN backend | core | Keep/Wrap | 业务知识网络核心 | 构建、契约、租户、性能和许可证通过；适配器隔离内部模型 |
| ontology-query | core | Keep/Wrap | 语义查询核心 | 固定契约、回归数据集、取消/超时和权限测试 |
| vega-backend | core | Keep/Wrap | 数据访问与查询 | 凭据、SQL/查询限制、大结果集、取消和审计验证 |
| native metrics | core | Select | 可复用指标能力 | 与 CEO-BP 指标版本/审批模型做差距分析，避免双权威源 |
| Dataflow 可构建模块 | core/dip | Select | 接入与解析 | 只纳入试点需要模块；确认源码、迁移、镜像和资源成本 |
| Context Loader | core/dip | Wrap/Select | 召回与重排基础 | 纳入统一 KnowledgeBase/Document/Chunk/ACL 模型和检索评估 |
| TraceAI | dip | Select | AI 调用观测 | 协议、敏感日志、采样、成本和维护性批准 |
| Agent/模型服务 | dip | Select | 编排基础 | 统一身份、工具白名单、审批、提示/模型版本和审计 |
| TypeScript SDK | sdk | Keep as client/test oracle | 契约和测试较成熟 | 升级到统一 OpenAPI 3.1 生成链，消除手写认证/HTTP 重复 |
| Python SDK | sdk | Keep as client/test oracle | Python 集成 | 同上；不让 SDK 反向承载业务逻辑 |
| Admin CLI | admin | Rewrite/Consolidate | 管理体验与测试资产 | 与统一 CLI 合并，认证、TLS、配置仅保留一套实现 |
| 缺失源码的 Core 发布项 | core manifest | Reject/Replace | 无法可靠维护 | 取得完整可构建源码、来源与许可证前不得依赖 |
| ISF 全套服务 | release dependency | Reject until source | 身份/基础设施依赖 | 必须取得源码、版本契约和分发权，或替换为企业 IAM/标准组件 |
| DIP business-system-service / migrator | dip manifest | Reject/Replace | 发布清单存在但源码不完整 | 同上 |
| LLM“智能预测” | dip | Narrative only | 可辅助情景描述 | 明确标注非统计预测；数值预测独立建设回测和区间 |

## 3. 已执行验证

- SDK TypeScript：lint、测试和构建通过，1530 个测试通过；
- SDK Python：455 个测试通过，4 个跳过；
- Admin：lint、测试和构建通过，91 个测试通过；
- Core/DIP 代表性 Go 测试和 Studio 依赖安装在观察窗口内未结束后主动中断，记录为“未完成”，不是失败；
- 发布清单与源码对照发现 Core、DIP 和 ISF 存在缺失源码服务；
- API 同时存在 Swagger 2.0、OpenAPI 3.0.x 和 3.1.x，缺少统一破坏性变更门禁；
- 发现部署/技能/语义模块及 SDK/Admin 的认证、TLS、Token、配置和 HTTP 客户端重复。

## 4. 阻断风险

- 镜像来源和标签不可重现，部分依赖私有镜像仓库；
- 示例/脚本存在默认凭据和敏感配置输出风险；
- 顶层许可证与部分 AGPL、UNLICENSED 子包的组合需要法律审计；
- 发布单元数量远超目标架构，直接部署会放大共享服务器资源风险；
- 缺失源码组件无法满足可维护、SBOM 和供应链要求。

## 5. 下一步证据包

每个拟保留组件分别建立准入记录，附：源码 SHA、构建命令、测试报告、OpenAPI/事件契约、SBOM、许可证结论、镜像摘要、资源基线、威胁模型、故障/恢复测试、所有者和退出方案。未完成证据包前，只允许在隔离开发环境做适配实验。
