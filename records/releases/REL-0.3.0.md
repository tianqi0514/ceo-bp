# REL-0.3.0：首个全栈企业控制台演示部署

- 版本：0.3.0
- 源提交：`f10dc710938cf06e6825dd3478a15aea1d7f64aa`
- 环境：121.196.149.55:9006
- 发布窗口：2026-07-30 18:48—18:52 CST
- 状态：Deployed（demo only）
- 发布角色：Codex 执行；项目负责人待复核

## 制品

| 制品 | 标识 | 说明 |
|---|---|---|
| 源码 | `f10dc710938cf06e6825dd3478a15aea1d7f64aa` | GitHub 分支 `codex/p1-platform-skeleton` |
| 镜像 | `ceo-bp/platform-api:0.3.0` | Image ID `sha256:77b43a8ddcd0256f60e5778d4069074285c9b293b62f0070f87f9e8baeb8ee67` |
| 传输归档 | SHA-256 `eb8c531497ea82c5a848d055e180778bad93db1101684b8fbb234b14a0bb9d98` | 约 48 MiB，加载后已删除 |
| 前端构建 | React/TypeScript/Vite | 与 API 同版本打包进镜像 |
| 基础镜像 | Node 22.20.0 Alpine + Python 3.12.11 slim | 均固定 OCI 摘要 |

## 门禁

- 测试：[TR-0.3.0-01](../tests/0.3.0/TR-0.3.0-01.md)，Conditional Go；
- 技术验收：[UAT-0.3.0-01](../acceptance/0.3.0/UAT-0.3.0-01.md)，Conditionally Accepted；
- CI：候选提交两次工作流均 success；
- 数据迁移：N/A，本版本无数据库；
- 正式业务 UAT：N/A，本版本无经营业务数据；
- 回滚镜像：`ceo-bp/platform-api:0.2.0` 保留在服务器。

## 实际执行

1. 确认 9006 由现有 CEO-BP 0.2.0 占用、约 1965 MiB 内存可用，其他容器运行；
2. 服务器仓库 fast-forward 到候选提交；
3. 传输 `linux/amd64` 镜像，核对归档 SHA-256 后加载并核对 Image ID；
4. 通过离线模式只重建 Compose 项目 `ceo-bp` 的 `platform-api`；
5. 完成 HTML、静态资源、API、OpenAPI、安全头、内外烟雾、资源和共存检查；
6. 删除服务器临时镜像归档。

## 回滚

本版本无持久数据。如需回滚，在项目目录指定 `CEO_BP_VERSION=0.2.0`、`CEO_BP_SKIP_BUILD=1` 和原提交的 build SHA，使用同一部署脚本只重建 `platform-api`。禁止执行 Compose 全项目 down 或全局 Docker 清理。

## 结论

部署成功并保持 healthy。允许演示平台状态和前后端共同交付基线，不构成生产上线或经营业务验收。
