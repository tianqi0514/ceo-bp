# REL-0.5.0-rc1：KWeaver 重构本地候选版本记录

| 属性 | 值 |
|---|---|
| 版本 | 0.5.0-rc1 |
| 日期 | 2026-08-03 |
| 类型 | KWeaver 本地集成候选 |
| 状态 | Local Candidate；未发布、未部署 9006 |
| 分支 | `codex/p1-platform-skeleton` |
| 环境 | `ceobp-kweaver-p2` / `127.0.0.1:19006` |
| Platform API 镜像 | `sha256:a84450e7f203b7acda2d8d6dd44b32b1c7892b52d4d81c917e5fe6e8564e88df` |

## 候选范围

- 锁定并构建 KWeaver Vega、BKN 和 ontology-query；
- Python 防腐层与知识网络列表、详情、创建和对象类型 API；
- 独立经营对象逻辑目录与托管数据集；
- React 知识网络工作台及经营对象字段建模；
- 自动化、真实运行时、重启持久化和浏览器技术验收。

## 数据与配置变更

- 新增幂等逻辑目录 `ceobp_business_catalog`；
- 在本地测试网络 `d9o0efoo1s7s73ep70l0` 保留验收对象“客户”及其托管数据集；
- Platform API 新增 `CEO_BP_KWEAVER_VEGA_BASE_URL` 和 `CEO_BP_KWEAVER_MANAGED_CATALOG_ID`；
- 不修改 9006、共享服务器、其他 Docker 项目或上游源码工作区。

## 验证与验收

- 测试：[TR-0.5.0-01](../tests/0.5.0/TR-0.5.0-01.md)、[TR-0.5.0-02](../tests/0.5.0/TR-0.5.0-02.md)、[TR-0.5.0-03](../tests/0.5.0/TR-0.5.0-03.md)；
- 验收：[UAT-0.5.0-01](../acceptance/0.5.0/UAT-0.5.0-01.md)、[UAT-0.5.0-02](../acceptance/0.5.0/UAT-0.5.0-02.md)；
- 候选仍缺认证、授权、审计、真实企业数据、关系、指标、性能、安全和恢复证据，因此禁止生产发布。

## 回滚

本地回滚只替换 Platform API 镜像为上一候选，并恢复对应 Compose 文件。对象类型与数据集属于持久化数据，未经明确批准不得通过回滚脚本删除；若需清理，必须先解析对象与资源的精确 ID，并按“对象类型后数据集”的顺序执行。
