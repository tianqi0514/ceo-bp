# P0 KWeaver Go 内核构建测试报告

| 属性 | 值 |
|---|---|
| 记录编号 | TR-P0-KWEAVER-20260731-01 |
| 日期 | 2026-07-31 |
| 结论 | 代码级准入通过；运行时准入未完成 |
| 执行环境 | Docker 29.2.1，`golang:1.25-bookworm`，Go 1.25.12 linux/amd64 |

## 1. 测试范围

来源为 `kweaver-core` 提交 `b9b35fb245c31660127114c883e91165b42dc8f0`，只读挂载源码，依赖和编译缓存使用 `ceobp-go-mod-cache`、`ceobp-go-build-cache` 专用 Docker 卷。

| 组件 | Go 声明 | 命令 | 结果 |
|---|---:|---|---|
| BKN backend | 1.25.0 | `I18N_MODE_UT=true go test ./...` | PASS |
| ontology-query | 1.25.0 | `I18N_MODE_UT=true go test ./...` | PASS |
| Vega backend | 1.25.0 | `I18N_MODE_UT=true go test ./...` | PASS |

三个命令均使用 240 秒独立超时保护并在门限内退出，退出码均为 0。代表性包复核也通过：BKN `common`/`driveradapters`，ontology-query `common`/`driveradapters`，Vega `interfaces`/`driveradapters`。

## 2. 发现与处置

1. 本地系统 Go 1.13 不满足上游要求；开发和 CI 必须使用固定 Go 1.25 工具链，禁止依赖开发机系统 Go。
2. 首次直接执行 BKN 测试未设置 `I18N_MODE_UT=true`，因测试二进制查找 `/src/driveradapters/locale` 失败。上游 Makefile 会设置该变量，按官方入口复测后通过。目标 CI 应显式固化该环境并添加入口回归测试。
3. 三个服务的代码可以独立编译和单测，但启动配置仍引用 MariaDB、OpenSearch、Kafka/Redis及多个 HTTP 服务；本报告不证明运行时依赖闭合。
4. BKN 同时注册 `/api/bkn-backend/v1` 与兼容的 `/api/ontology-manager/v1`；SDK 的知识网络 CRUD 主要使用后者，原生指标/概念组等能力使用前者。防腐层必须统一两组路径，业务模块不得感知差异。
5. 上游配置中存在固定局域网主机及示例口令。任何配置进入目标仓库前必须改为环境/密钥引用，并通过秘密扫描。
6. 三个模块 `go.mod` 均声明 1.25.0；BKN 和 Vega 的容器构建默认值进一步固定到 Go 1.25.x。先前文档中的 Go 1.24 判断作废。

## 3. 尚未通过的门禁

- 未完成最小运行依赖 Compose、数据库迁移和 API 烟雾测试；
- 未完成 SBOM、传递许可证和 CVE 报告；
- 未验证认证、租户隔离、审计、超时、取消与故障恢复；
- 未建立 KWeaver SDK 与三个 Go 服务间的固定契约回归；
- 未测量共享服务器所需 CPU、内存、磁盘和启动时间。

因此当前只允许进入 P1 防腐层开发和隔离集成环境建设，不批准在 9006 共享服务器部署完整 KWeaver 运行栈。
