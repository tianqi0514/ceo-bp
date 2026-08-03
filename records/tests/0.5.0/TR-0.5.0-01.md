# TR-0.5.0-01：KWeaver 重构 P0/P1 候选测试报告

- 候选版本：`0.5.0-rc1`（未发布）
- 候选提交：`a90331d` 及其前序 KWeaver 重构提交
- 执行日期：2026-07-31
- 环境：本地 Python 3.12.13、Node 24.13、Docker 29.2.1、Go 1.25.12 linux/amd64 容器
- 结论：代码与契约测试通过；真实运行时集成未完成；禁止部署到 9006

## 1. 测试对象

本候选不延续 0.4.0 的决策矩阵产品方向。测试对象为锁定 KWeaver 源码、三个 Go 内核、官方 Python SDK、防腐层、知识网络 API、知识网络前端工作台及组合镜像。

上游提交：

| 仓库 | 提交 |
|---|---|
| kweaver-core | `b9b35fb245c31660127114c883e91165b42dc8f0` |
| kweaver-dip | `534fa829836123f36c611874829838a1ff65a4ba` |
| kweaver-sdk | `b5e7a3b5ef36604e0d7b05d688287562815add87` |
| kweaver-admin | `4b234dff2f6117b597467a19d4cff6d03d59ae83` |

## 2. 自动化结果

| 检查 | 结果 | 证据摘要 |
|---|---|---|
| BKN backend Go 测试 | Pass | `I18N_MODE_UT=true go test ./...`，退出码 0 |
| ontology-query Go 测试 | Pass | `I18N_MODE_UT=true go test ./...`，退出码 0 |
| Vega backend Go 测试 | Pass | `I18N_MODE_UT=true go test ./...`，退出码 0 |
| Python Ruff | Pass | 0 问题 |
| Python mypy strict | Pass | 7 个源文件，0 问题 |
| Python pytest | Pass | 31/31，覆盖率 96.65% |
| 前端 Biome | Pass | 16 个文件，0 问题 |
| 前端 TypeScript | Pass | 0 类型错误 |
| 前端 Vitest | Pass | 15/15；语句 96.77%、分支 86.30%、函数 100%、行 97.39% |
| 前端生产构建 | Pass | HTML 0.61 kB；CSS 7.07 kB；JS 207.03 kB（gzip 65.72 kB） |
| 组合 Docker 构建 | Pass | Image ID `sha256:2f2f0be6b66964ce7980c32ecc3d3c50f10928e67d485443cc3a23a1e0e97aa5` |
| 容器烟雾 | Pass | 非 root `10001:10001`；健康接口 ready；SDK 0.8.4；最终镜像无 Git |

三个 Go 全模块命令均使用 240 秒超时保护；详细上游构建证据见 [P0 KWeaver Go 内核构建测试报告](../P0-KWEAVER-GO-BUILD-REPORT.md)。

## 3. 已验证业务契约

| 用例 | 结果 | 说明 |
|---|---|---|
| 列出知识网络 | Pass | 映射 `/api/ontology-manager/v1/knowledge-networks`，保留分页和名称查询 |
| 查看知识网络 | Pass | 获取真实统计并转换对象、关系、动作和概念组字段 |
| 创建知识网络 | Pass | 传递名称、说明、标签和上游 `main` 分支语义 |
| 触发全量构建 | Pass | 调用 KWeaver jobs 端点并返回明确 accepted 回执 |
| 认证头 | Pass | 原始 token 统一转换为 `Bearer`，业务域头由配置注入 |
| 错误防腐 | Pass | 400/401/403/404/409/418/5xx/网络错误转换为稳定错误码，不泄露上游敏感消息 |
| 未配置环境 | Pass | 返回 `KWEAVER_NOT_CONFIGURED` 503，不生成假知识网络 |
| 前端搜索/创建/详情/构建 | Pass | 所有主要按钮均有 API 调用、执行态、失败反馈和测试 |

## 4. 组合镜像烟雾

使用本机 `127.0.0.1:19006` 临时端口运行候选镜像，没有占用公网 9006。验证：

- `/health/ready` 返回 ready；
- `/` 返回同镜像构建的 SPA；生产 JS 包含 KWeaver 知识网络工作台；
- 未配置上游时 `/api/v1/knowledge-networks` 返回明确 503；
- 容器内 `kweaver-sdk` 为 0.8.4；
- 容器用户为 `10001:10001`，安装 SDK 所需 Git 已清除；
- 临时烟雾容器已停止并由 `--rm` 清理。

## 5. 未通过门禁与下一步

以下工作未完成，因此本候选不能发布或验收：

1. MariaDB、OpenSearch、Kafka/Redis 与三个 Go 服务的最小 Compose 尚未闭合；
2. 尚未以真实数据源完成“Vega 资源—BKN 对象—指标查询”集成；
3. 尚未完成 IAM/租户、权限、审计、超时、取消、恢复和容量测试；
4. 尚未完成上游传递依赖 SBOM、CVE 和法务批准；
5. 前端当前只覆盖知识网络入口，对象、关系、指标和任务页面将在对应 API 接通后逐屏迁移；
6. 未执行人工浏览器视觉、跨浏览器和辅助技术验收。

下一阶段只在隔离环境建立最小 KWeaver 运行栈。资源基线、数据迁移和回滚验证通过后，才可形成 0.5.0 发布记录与 UAT，并评估替换 9006 上的历史 0.4.0。
