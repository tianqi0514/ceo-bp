# 过程文档模板

创建记录时复制对应模板，替换所有占位内容，并保存到指定位置。模板本身不能作为活动已完成的证据。

| 模板 | 用途 | 实例位置 |
|---|---|---|
| [REQUIREMENT.md](REQUIREMENT.md) | 需求与验收标准 | 项目工单或 `records/requirements/` |
| [ADR.md](ADR.md) | 架构决策 | `docs/02-architecture/adr/` |
| [TEST_PLAN.md](TEST_PLAN.md) | 版本测试计划 | `records/tests/<version>/` |
| [TEST_REPORT.md](TEST_REPORT.md) | 版本测试结果 | `records/tests/<version>/` |
| [RELEASE_RECORD.md](RELEASE_RECORD.md) | 发布和回滚记录 | `records/releases/` |
| [UAT_RECORD.md](UAT_RECORD.md) | 业务验收 | `records/acceptance/<version>/` |
| [RISK_REGISTER.md](RISK_REGISTER.md) | 风险台账 | `records/risks/` |

占位符使用尖括号，例如 `<version>`。提交实例前必须全部替换或明确写 `N/A（原因）`。
