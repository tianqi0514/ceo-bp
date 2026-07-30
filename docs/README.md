# 文档中心

本目录只存放当前有效的规范、设计和操作手册。每次真实执行产生的版本、测试、验收、决策和风险证据统一存入 [`records/`](../records/README.md)。空白模板统一存入 [`templates/`](../templates/README.md)。

## 导航

| 分类 | 文档 | 作用 |
|---|---|---|
| 治理 | [完整开发备忘录](00-governance/DEVELOPMENT_MEMO.md) | 项目最高层执行基线 |
| 治理 | [文档控制规范](00-governance/DOCUMENT_CONTROL.md) | 编号、状态、审批、归档规则 |
| 产品 | [范围与路线图](01-product/SCOPE_AND_ROADMAP.md) | 产品边界、MVP、阶段目标 |
| 产品 | [需求管理](01-product/REQUIREMENTS_MANAGEMENT.md) | 需求进入、分析、追踪和变更 |
| 架构 | [目标架构](02-architecture/TARGET_ARCHITECTURE.md) | 系统边界、部署单元、数据流 |
| 架构 | [迁移策略](02-architecture/MIGRATION_STRATEGY.md) | 上游组件复用、替换和退出规则 |
| 架构 | [架构决策记录](02-architecture/adr/README.md) | 已批准的重要技术决策 |
| 开发 | [开发工作流](03-development/DEVELOPMENT_WORKFLOW.md) | 分支、评审、DoR、DoD、门禁 |
| 开发 | [工程规范](03-development/ENGINEERING_STANDARDS.md) | API、数据、代码和依赖规范 |
| 测试 | [测试策略](04-testing/TEST_STRATEGY.md) | 测试分层、环境、准入准出 |
| 发布 | [版本与发布管理](05-release/RELEASE_MANAGEMENT.md) | 版本号、制品、迁移、回滚 |
| 验收 | [验收手册](06-acceptance/ACCEPTANCE_MANUAL.md) | UAT、业务与非功能验收流程 |
| 运维 | [运维、安全与合规](07-operations/OPERATIONS_SECURITY.md) | SLO、监控、事件、供应链安全 |

## 文档状态

- `Draft`：草拟中，不作为实施依据；
- `In Review`：评审中，未批准；
- `Baseline`：已批准的当前实施依据；
- `Superseded`：已被新版本替代，仅保留历史；
- `Archived`：不再适用，禁止继续引用。

本批文档在仓库合并后作为 **v0.1.0 Baseline**。重大变更必须通过 PR 和 ADR；普通修订必须在文档头部更新版本与日期，并在 `CHANGELOG.md` 记录。
