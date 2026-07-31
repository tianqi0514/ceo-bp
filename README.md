# CEO-BP 企业经营决策分析平台

CEO-BP 是面向企业经营管理者的决策分析平台。本仓库用于统一承载产品文档、架构、代码、测试、部署及全过程记录。

当前仓库处于 **v0.5.0-rc1 KWeaver 重构开发阶段**：已锁定并验证 KWeaver Core、DIP、SDK、Admin 源码基线，完成 BKN/ontology-query/Vega 的 Go 1.25 全模块测试，以及知识网络 Python 防腐层、API 和前端工作台。9006 仍运行历史 0.4.0 探索版本；在最小 KWeaver 运行栈和真实数据集成通过前，不升级共享环境，也不代表生产可用版本。

## 项目目标

平台将数据接入、指标语义、企业知识、经营分析、预测模拟和决策闭环连接起来，回答以下问题：

- 发生了什么：统一指标口径、经营驾驶舱、实际与计划对比；
- 为什么发生：异常检测、维度下钻、贡献与归因分析；
- 将会发生什么：可回测的统计预测和置信区间；
- 可以怎么做：场景模拟、方案比较、风险与收益评估；
- 是否产生效果：决策审批、执行跟踪、结果复盘和知识沉淀。

## 文档入口

- [完整开发备忘录](docs/00-governance/DEVELOPMENT_MEMO.md)
- [文档导航与生命周期](docs/README.md)
- [产品范围与路线图](docs/01-product/SCOPE_AND_ROADMAP.md)
- [目标架构](docs/02-architecture/TARGET_ARCHITECTURE.md)
- [KWeaver 重构实施蓝图](docs/02-architecture/KWEAVER_REFACTOR_BLUEPRINT.md)
- [迁移与复用策略](docs/02-architecture/MIGRATION_STRATEGY.md)
- [开发工作流](docs/03-development/DEVELOPMENT_WORKFLOW.md)
- [测试策略](docs/04-testing/TEST_STRATEGY.md)
- [版本与发布管理](docs/05-release/RELEASE_MANAGEMENT.md)
- [验收手册](docs/06-acceptance/ACCEPTANCE_MANUAL.md)
- [运维、安全与合规](docs/07-operations/OPERATIONS_SECURITY.md)
- [9006 演示环境部署](docs/08-environments/DEMO_DEPLOYMENT.md)
- [过程记录](records/README.md)
- [变更日志](CHANGELOG.md)

## 建议仓库结构

```text
apps/                       前端应用
services/                   可部署后端服务
packages/                   契约、SDK、CLI、UI 与共享包
deploy/                     部署、迁移和环境配置
docs/                       当前有效的规范与设计
records/                    已执行过程的不可变记录
templates/                  新建过程文档的模板
tools/                      仓库级校验工具
tests/                      跨模块契约、集成和验收测试
```

当前 `platform-api` 通过锁定提交的官方 KWeaver Python SDK 调用经准入的 Go 内核，`apps/console` 正按 DIP/Vega 的业务流程逐屏迁移。上游源码尚未复制进主仓库，完整许可证、SBOM 和运行时准入完成前不发布组合二进制。

## 文档校验

要求 Python 3.11 或更高版本：

```bash
python3 tools/validate_docs.py
make verify
```

## 协作规则

任何实现工作都必须能追溯到需求或缺陷；任何发布都必须关联版本记录、测试报告和验收结论。详细规则见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证说明

本项目自身许可证及上游组件准入结论尚待项目负责人和法务确认。在许可证基线批准前，不向本仓库直接复制上游项目源码，也不对外发布二进制制品。
