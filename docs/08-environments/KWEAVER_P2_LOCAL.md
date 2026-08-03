# KWeaver P2 隔离开发环境手册

| 属性 | 值 |
|---|---|
| 文档编号 | ENV-002 |
| 版本 | 0.5.0-rc1 |
| 状态 | Baseline |
| 生效日期 | 2026-08-03 |
| 责任角色 | 开发与运维负责人 |

本手册用于本地 `ceobp-kweaver-p2` 运行栈。它只绑定 `127.0.0.1:19006`，不得作为生产部署模板，也不得改为 9006 后直接上线。

## 前置条件

- Docker Compose v2、Git、Python 3；
- KWeaver Core 检出到 `upstream/kweaver.lock.yaml` 指定提交；
- 为本开发栈单独生成数据库用户密码和 root 密码，不写入仓库或命令记录；
- 不复用其他项目的容器、网络和卷。

```bash
export KWEAVER_CORE_DIR=/absolute/path/to/kweaver-core
export CEO_BP_KWEAVER_RUNTIME_DIR=/absolute/path/to/ceo-bp/.runtime/kweaver
export CEO_BP_KWEAVER_DB_PASSWORD='<development-user-password>'
export CEO_BP_KWEAVER_DB_ROOT_PASSWORD='<different-development-root-password>'
```

## 构建与启动

```bash
deploy/scripts/preflight-kweaver-dev.sh "$PWD"
deploy/scripts/render-kweaver-configs.sh "$PWD"
deploy/scripts/build-kweaver-images.sh "$PWD"
docker compose -f deploy/compose/compose.kweaver-dev.yml up -d --pull never
deploy/scripts/verify-kweaver-dev.sh "$PWD"
```

预期验证结果包含 `version=0.5.0-rc1`。`config-init` 和 `catalog-init` 应为 `Exited (0)`；MariaDB、Redis、OpenSearch、Redpanda 和 Platform API 应为 healthy；Vega、BKN、ontology-query 应持续运行。

## 用户验收入口

- 控制台：`http://127.0.0.1:19006/`
- 健康检查：`http://127.0.0.1:19006/health/ready`
- OpenAPI：`http://127.0.0.1:19006/openapi.json`

只录入非敏感测试数据。创建知识网络后，应验证列表、详情、说明、标签和 BKN 重启后的持久化。空知识网络没有对象类型，控制台不得提供全量构建操作。

## 停止与恢复

```bash
docker compose -f deploy/compose/compose.kweaver-dev.yml stop
docker compose -f deploy/compose/compose.kweaver-dev.yml start
deploy/scripts/verify-kweaver-dev.sh "$PWD"
```

普通停止不得删除卷。只有在确认测试数据可丢弃并完成目标核对后，才可显式删除 `ceobp-kweaver-p2-*` 容器、网络和卷；不得使用未解析变量、通配符或其他项目名称作为删除目标。

## 当前限制

- 开发栈关闭 KWeaver 认证和审计；
- 尚未完成对象类型、关系类型、指标和数据源编辑；
- 尚无生产备份恢复、容量、安全和故障演练证据；
- 121.196.149.55:9006 不在本手册操作范围。
