# TR-0.5.0-02：KWeaver P2 真实运行时集成测试报告

- 候选版本：`0.5.0-rc1`（未发布）
- 上游基线：`kweaver-core@b9b35fb245c31660127114c883e91165b42dc8f0`
- 环境：本地 Docker Desktop，隔离项目 `ceobp-kweaver-p2`，仅 `127.0.0.1:19006` 对外
- 执行日期：2026-08-03
- 结论：Conditional Go（仅 P2 本地开发栈）；9006 与生产部署 No-Go

## 执行摘要

P2 已从模拟契约推进为 MariaDB、Redis、OpenSearch、Redpanda、Vega、BKN、ontology-query、Platform API 和 React 控制台的真实组合运行。创建、列表、详情和重启持久化链路使用真实 KWeaver Core；未向 9006 发布，也未改动其他 Docker 项目。

## 自动化结果

| 套件 | 结果 | 证据摘要 |
|---|---|---|
| 文档校验 | Pass | 71 个 Markdown 文件，内部链接与结构通过 |
| Python Ruff / mypy | Pass | 0 lint、0 strict typing 问题 |
| Python pytest | Pass | 31/31；总覆盖率 96.30% |
| 前端 Biome / TypeScript | Pass | 0 格式、静态与类型问题 |
| 前端 Vitest | Pass | 15/15；语句 96.77%、分支 87.01%、函数 100%、行 97.39% |
| 前端生产构建 | Pass | Vite 构建成功；JS 207.07 kB，gzip 65.73 kB |
| Vega 补丁回归 | Pass | text 引用的 keyword 子字段由失败转为通过 |
| BKN 补丁回归 | Pass | 重复字段名、重复显示名断言先失败，修复后通过 |

完整仓库门禁命令为 `make verify`，退出码 0。补丁治理与复验命令见 [ADR-0005](../../../docs/02-architecture/adr/ADR-0005-KWEAVER-PATCH-GOVERNANCE.md) 和 [`components/kweaver/patches/README.md`](../../../components/kweaver/patches/README.md)。

## 真实运行时结果

| 用例 | 预期 | 实际 | 结果 |
|---|---|---|---|
| 隔离启动 | 不占用 9006，不加入其他项目网络 | 仅 Platform API 映射 `127.0.0.1:19006`；网络与卷均使用 `ceobp-kweaver-p2-*` | Pass |
| 非 root 镜像 | 四个业务容器不以 root 运行 | Vega、BKN、ontology-query、Platform API 均为 `10001:10001` | Pass |
| BKN 初始化 | 创建 BKN 概念数据集且不重启 | `adp_bkn_concept_dataset` 创建成功，BKN restart=0 | Pass |
| 目录可用 | 数据集目录处于 enabled | 非 root `catalog-init` 幂等退出 0，重启后无 `Catalog.IsDisabled` | Pass |
| 创建知识网络 | 名称、说明、标签完整返回并持久化 | `区域盈利分析网络` 返回 201，字段完整 | Pass |
| 查询与详情 | 列表和统计来自真实 Core | 两个测试网络可列表；详情返回四类统计 | Pass |
| 重启持久化 | BKN 重启后数据仍存在 | 两个网络及说明、标签保持一致 | Pass |
| 空网络操作约束 | 不向用户展示必然失败的构建按钮 | Core 对空网络构建返回 422；控制台已隐藏该操作 | Pass |

候选镜像：Vega `sha256:80328709…3614`、BKN `sha256:5d2f582f…fa79`、ontology-query `sha256:ef5dca2e…eb15`、Platform API `sha256:d116bd17…5303`。

## 已修复缺陷

| 缺陷 | 根因 | 处置 |
|---|---|---|
| BKN 启动时 Vega 拒绝 keyword/text | Vega 校验与其 OpenSearch 映射能力不一致 | 最小 Vega 补丁 + 回归测试 |
| BKN 初始化字段重复 | `data_properties.index_config` 定义两次 | 删除重复定义 + 唯一性测试 |
| BKN 显示名重复 | `unit_type.display_name` 误写为 `schedule` | 改为 `unit_type` + 唯一性测试 |
| 创建响应字段为空、说明丢失 | 锁定 SDK 与 Core 的稀疏响应和 `description/comment` 契约漂移 | Python 反腐层通过公开 SDK 完成兼容更新并回读 |
| Vega 目录禁用 | BKN 创建逻辑目录后未启用 | Compose 一次性幂等启用任务 |

## 残余风险与准出限制

- 尚未交付对象类型、关系类型、指标和数据源的用户纵向切片，不能执行真实经营模型构建；
- 开发栈关闭认证与审计，禁止作为生产模板；正式环境必须启用 Kafka SASL 审计；
- 尚未执行备份恢复、容量、压力、安全扫描和故障注入；
- 未部署 121.196.149.55:9006，历史 0.4.0 服务保持不变。

P2 可作为下一阶段对象类型纵向切片的开发基线。只有完成上述生产准入项和业务 UAT 后，才能评估替换 9006。
