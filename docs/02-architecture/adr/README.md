# 架构决策记录（ADR）

ADR 记录难以逆转、跨模块或长期影响显著的技术决策。批准后不删除旧 ADR；新决策通过新 ADR 将旧记录标记为 `Superseded`。

| ADR | 决策 | 状态 |
|---|---|---|
| [ADR-0001](ADR-0001-HYBRID-BACKEND.md) | Python 控制/业务面 + Go 核心数据面 | Accepted |
| [ADR-0002](ADR-0002-MODULAR-MONOLITH.md) | platform-api 先采用模块化单体 | Accepted |
| [ADR-0003](ADR-0003-KNOWLEDGE-BOUNDARIES.md) | 文档知识库、业务知识网络与决策档案分离 | Accepted |

新增 ADR 使用 [`templates/ADR.md`](../../../templates/ADR.md)。
