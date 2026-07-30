# 贡献指南

本仓库采用“需求—设计—实现—测试—发布—验收—复盘”的可追溯开发流程。

## 开始工作前

1. 创建或确认需求、缺陷或技术债编号；
2. 满足 [Definition of Ready](docs/03-development/DEVELOPMENT_WORKFLOW.md#definition-of-readydor)；
3. 涉及架构、安全、数据模型或外部契约的变更先提交 ADR 或设计文档；
4. 从主干创建短生命周期分支，建议命名为 `feat/REQ-编号-摘要`、`fix/BUG-编号-摘要` 或 `docs/摘要`。

## 提交与评审

- 提交信息使用 `type(scope): summary`，例如 `feat(metrics): add metric version API`；
- Pull Request 必须关联需求，说明影响范围、测试证据、数据库/API 变更和回滚方法；
- 作者不得作为唯一批准人；高风险变更需架构、安全或数据责任人共同评审；
- 不提交密钥、口令、真实个人信息、生产数据或未获许可的第三方源码。

## 合并门禁

- 自动化检查全部通过；
- 新增或变更行为有对应测试；
- API、配置、数据迁移和运维文档已同步更新；
- 满足 [Definition of Done](docs/03-development/DEVELOPMENT_WORKFLOW.md#definition-of-donedod)；
- 破坏性变更已获得明确批准并提供迁移方案。

## 发布与记录

版本规则、发布门禁和回滚要求见 [版本与发布管理](docs/05-release/RELEASE_MANAGEMENT.md)。测试和验收结果必须由模板实例化后放入 `records/`，不得只存在于聊天、邮件或流水线临时日志中。
