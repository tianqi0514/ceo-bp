# REL-0.3.1：运行状态控制台去概念化发布

- 版本：0.3.1
- 源提交：`44c94030a5286f8904096cb189966811aa9dde91`
- 环境：121.196.149.55:9006
- 发布窗口：2026-07-30 19:11—19:14 CST
- 状态：Deployed（demo only）
- 发布角色：Codex 执行；项目负责人待复核

## 变更与制品

- 删除未来能力导航、阶段标签、路线图、系统链路、交付理念和下一阶段说明；
- 新增真实启动时间、服务器时间、运行时长和可访问端点；
- 仅保留刷新、错误重试、API 文档和端点访问等实际交互；
- 镜像 `ceo-bp/platform-api:0.3.1`，Image ID `sha256:a70467eadea3ee934696ccceaadedefbdb933163dfa4e3d9c9895a7b046c4976`；
- 镜像归档 SHA-256 `e61151b6723ac2cc6f7826130dcfe2b137c721bc5ff0a11ca9d826f148a11005`，加载后删除。

## 门禁

- 测试：[TR-0.3.1-01](../tests/0.3.1/TR-0.3.1-01.md)，Go；
- 技术验收：[UAT-0.3.1-01](../acceptance/0.3.1/UAT-0.3.1-01.md)，Accepted；
- CI：候选提交 `docs` 与 `ceo-bp-fullstack` 均 success；
- 数据迁移：N/A，本版本无数据库；
- 回滚镜像：`ceo-bp/platform-api:0.3.0` 保留在服务器。

## 实际执行与偏差

1. 部署前确认 9006 归属、项目工作区和其他容器清单；
2. 服务器访问 GitHub 两次超时，线上服务未受影响；
3. 改用经 SHA-256 校验的 Git 完整 bundle，将仓库 fast-forward 到同一候选提交；
4. 校验镜像归档和 Image ID，通过离线模式只重建 `platform-api`；
5. 完成内外各 20 次健康检查、静态产物禁用文案扫描、API、OpenAPI、运行限制和共存检查；
6. 删除服务器临时 bundle 与镜像归档。

## 回滚

本版本无持久数据。需要回滚时指定 `CEO_BP_VERSION=0.3.0`、`CEO_BP_SKIP_BUILD=1` 和 0.3.0 build SHA，使用同一部署脚本只重建 `platform-api`。禁止执行 Compose 全项目 down 或全局 Docker 清理。

## 结论

发布成功并保持 healthy。该版本确立“只展示已实现功能、交互逐项可验证”的前端交付基线。
